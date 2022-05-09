import json
import numpy as np
import pandas as pd
from collections import defaultdict
import inspect

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"
FILE_SANKEY = "sankey.xlsx"

# select needed years
NEEDED_YEARS = range(2000, 2020)

# ----------------------------------------------------------------------------------------------------------------
# READ AND FILTER DATA
# ----------------------------------------------------------------------------------------------------------------

# read sankey and select needed attributes
DF_SANKEY = pd.read_excel(FILE_SANKEY, sheet_name=['Nodes', 'Links', 'NodesMSN', 'LinksMSN', 'Group', 'GroupSum'])

# select needed msn
NEEDED_MSN = DF_SANKEY["NodesMSN"]["MSN"].drop_duplicates().values.tolist() + DF_SANKEY["LinksMSN"]["MSN"].drop_duplicates().values.tolist()


# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# filter dataset
DF_DATASET = DF_DATASET[
    DF_DATASET["Year"].isin(NEEDED_YEARS) 
    & 
    DF_DATASET["MSN"].isin(NEEDED_MSN)
]


# ----------------------------------------------------------------------------------------------------------------
# PIVOT AND ADD DATA
# ----------------------------------------------------------------------------------------------------------------

# pivot dataframe
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]
# change to normal dataframe
# https://stackoverflow.com/questions/43756052/transform-pandas-pivot-table-to-regular-dataframe
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())


# add nodes
DF_NODES = DF_DATASET[["StateCode", "Year"]]

NODES = DF_SANKEY["Nodes"].set_index("Node").to_dict(orient="index")

DF_NODES = DF_NODES.assign(**{ node: 0 for node in NODES.keys()})

for index, value in DF_SANKEY["NodesMSN"].iterrows():
    DF_NODES[value["Node"]] += DF_DATASET[value["MSN"]] * value["Coefficient"]


# add links
DF_LINKS = DF_DATASET[["StateCode", "Year"]]

LINKS = DF_SANKEY["Links"].set_index("Link").to_dict(orient="index")

DF_LINKS = DF_LINKS.assign(**{ link: 0 for link in LINKS.keys()})

def _temp(x, coefficient):
    if(np.isnan(x)):
        return 0
    return x*coefficient

for index, value in DF_SANKEY["LinksMSN"].iterrows():
    DF_LINKS[value["Link"]] += DF_DATASET[value["MSN"]].transform(lambda x: _temp(x, value["Coefficient"]))



# ----------------------------------------------------------------------------------------------------------------
# GROUP DATA
# ----------------------------------------------------------------------------------------------------------------

GROUPMAP = defaultdict(dict)
CHILDS = {}

# traverse the tree to find the needed leaf nodes to sum in the group
for index, value in DF_SANKEY["GroupSum"].iterrows():
    parent = value["Parent"]
    child = value["Child"]
    CHILDS[parent] = [_value["Child"] for index, _value in DF_SANKEY["GroupSum"].iterrows() if (_value["Parent"] == parent)]
    if(not CHILDS.get(child)):
        CHILDS[child] = []

for parent in CHILDS.keys():
    leafs = []
    def trackEnd(_parent):
        for _child in CHILDS[_parent]:
            if(len(CHILDS[_child]) == 0):
                leafs.append(_child)
            else:
                trackEnd(_child)
    trackEnd(parent)
    GROUPMAP[parent]["nodes"] = leafs
    GROUPMAP[parent]["sourceLinks"] = defaultdict(list)
    GROUPMAP[parent]["targetLinks"] = defaultdict(list)
    for link in LINKS.keys():
        if(LINKS[link]["Target"] in leafs):
            GROUPMAP[parent]["sourceLinks"][LINKS[link]["Source"]].append(link)
        elif(LINKS[link]["Source"] in leafs):
            GROUPMAP[parent]["targetLinks"][LINKS[link]["Target"]].append(link)


NODESGROUPS = pd.concat( [ DF_SANKEY["Nodes"], DF_SANKEY["Group"] ] )
NODESGROUPS = NODESGROUPS.set_index("Node").to_dict(orient="index")


def ENCODE_LINK_ID(source, target):
    return f"{source}->{target}"
def DECODE_LINK_ID(link):
    link = link.split("->")
    return {
        "source": link[0],
        "target": link[1]
    }

# add data for group. remove leaf node in the process
NEEDED_GROUP = ["Renewable"]

for group in GROUPMAP.keys():
    if(group not in NEEDED_GROUP):
        continue
    DF_NODES[group] = DF_NODES[GROUPMAP[group]["nodes"]].sum(axis=1)
    DF_NODES = DF_NODES.drop(columns=GROUPMAP[group]["nodes"])
    NODES[group] = NODESGROUPS[group]
    for source in GROUPMAP[group]["sourceLinks"].keys():
        DF_LINKS[ENCODE_LINK_ID(source, group)] = DF_LINKS[GROUPMAP[group]["sourceLinks"][source]].sum(axis=1)
        LINKS[ENCODE_LINK_ID(source, group)] = {
            "Source": source,
            "Target": group
        }
        DF_LINKS = DF_LINKS.drop(columns=GROUPMAP[group]["sourceLinks"][source])
    for target in GROUPMAP[group]["targetLinks"].keys():
        DF_LINKS[ENCODE_LINK_ID(group, target)] = DF_LINKS[GROUPMAP[group]["targetLinks"][target]].sum(axis=1)
        LINKS[ENCODE_LINK_ID(group, target)] = {
            "Source": group,
            "Target": target
        }
        DF_LINKS = DF_LINKS.drop(columns=GROUPMAP[group]["targetLinks"][target])


# ----------------------------------------------------------------------------------------------------------------
# UNPIVOT DATA
# ----------------------------------------------------------------------------------------------------------------


DF_NODES = pd.melt(frame=DF_NODES, id_vars=["StateCode", "Year"], var_name="Node", value_name="Data")
DF_LINKS = pd.melt(frame=DF_LINKS, id_vars=["StateCode", "Year"], var_name="Link", value_name="Data")

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

# removing nodes
REMOVE_NODES = ["WoodProduction"]
#  , "Nuclear", "FossilFuel", "ElectricLoss", "ElectricImport", "ElectricExport", "NetInterstateImport", "NetInterstateExport"]

# transform to dict
DATA_NODES = DF_NODES.set_index(keys=["StateCode", "Year", "Node"]).to_dict(orient="index")
DATA_LINKS = DF_LINKS.set_index(keys=["StateCode", "Year", "Link"]).to_dict(orient="index")

# transform tuple key to nested dict

DATA = defaultdict(
    lambda: defaultdict(
        lambda: 
        {
            "nodes":[],
            "links": [],
            "nodelist" : [],
            "nodeid" : {

            }
        }
    )
)

STATE_YEARS = []

# add nodes
for key, value in DATA_NODES.items():
    state, year, node = key
    value = value["Data"]

    # remove NaN values
    if(np.isnan(value) or value <= 0 or node in REMOVE_NODES):
        continue

    if((state, year) not in STATE_YEARS):
        STATE_YEARS.append((state, year))

    nodelist = DATA[state][year]["nodelist"]
    nodeid = DATA[state][year]["nodeid"]

    if(node not in nodelist):
        # nodeid[node] = len(nodelist)
        nodeid[node] = NODES[node]["Id"]
        nodelist.append(node)


# sort nodes
for state, year in STATE_YEARS:
    nodeid = DATA[state][year]["nodeid"]
    DATA[state][year]["nodelist"].sort(key=lambda node: NODES[node]["Id"])
    nodelist = DATA[state][year]["nodelist"]
    for i in range(0, len(nodelist)):
        node = nodelist[i]
        nodeid[node] = i
    
    

# format nodes
for state, year in STATE_YEARS:

    nodeid = DATA[state][year]["nodeid"]
    nodelist = DATA[state][year]["nodelist"]

    for node in nodelist:

        value = DATA_NODES[(state, year, node)]["Data"]
    
        DATA[state][year]["nodes"].append(
            {
                "node": nodeid[node],
                "name": NODES[node]["Name"],
                "data": {
                    "id": node,
                    "name": NODES[node]["Name"],
                    "value": value,
                }
            }
        )

# add links
for key, value in DATA_LINKS.items():
    state, year, link = key
    value = value["Data"]

    # remove NaN values
    if(np.isnan(value) or value <= 0 or node in REMOVE_NODES):
        continue

    source = LINKS[link]["Source"]
    target = LINKS[link]["Target"]

    nodelist = DATA[state][year]["nodelist"]
    nodeid = DATA[state][year]["nodeid"]

    # if source or target is not in nodelist, stop including the link
    if(
        source not in nodelist
        or
        target not in nodelist
    ):
        continue

    DATA[state][year]["links"].append(
        {
            "source": nodeid[source],
            "target": nodeid[target],
            "value": value,
            "data": {
                "id": link,
                "source" : source,
                "target": target,
                "value": value,
            }
        }
    )


# write data to file
open("transformed.json", "w").write(json.dumps(DATA, sort_keys=False, indent='\t'))

# test
open("sankey.json", "w").write(json.dumps(DATA["CA"][2018], sort_keys=False, indent='\t'))

DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

DF_DATASET = DF_DATASET[(DF_DATASET["StateCode"] == "US") & (DF_DATASET["Year"] == 2019)]
#  & (DF_DATASET["MSN"].isin(NEEDED_MSN))]

DF_MSN = pd.read_csv(FILE_MSN)

DF_DATASET = pd.merge(DF_DATASET, DF_MSN, on="MSN")

DF_DATASET.to_csv("log.csv")

# 