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
DF_SANKEY_MSN = pd.read_excel(FILE_SANKEY, sheet_name=['Nodes', 'Links', 'NodesMSN', 'LinksMSN'])

# select needed msn
NEEDED_MSN = DF_SANKEY_MSN["NodesMSN"]["MSN"].drop_duplicates().values.tolist() + DF_SANKEY_MSN["LinksMSN"]["MSN"].drop_duplicates().values.tolist()


# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# filter dataset
DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN)]


# ----------------------------------------------------------------------------------------------------------------
# ADD DATA
# ----------------------------------------------------------------------------------------------------------------

# pivot dataframe
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]
# change to normal dataframe
# https://stackoverflow.com/questions/43756052/transform-pandas-pivot-table-to-regular-dataframe
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())


# add nodes
DF_NODES = DF_DATASET[["StateCode", "Year"]]

NODES = DF_SANKEY_MSN["Nodes"].set_index("Node").to_dict(orient="index")

DF_NODES = DF_NODES.assign(**{ node: 0 for node in NODES.keys()})

for index, value in DF_SANKEY_MSN["NodesMSN"].iterrows():
    DF_NODES[value["Node"]] += DF_DATASET[value["MSN"]] * value["Coefficient"]


# add links
DF_LINKS = DF_DATASET[["StateCode", "Year"]]

LINKS = DF_SANKEY_MSN["Links"].set_index("Link").to_dict(orient="index")

DF_LINKS = DF_LINKS.assign(**{ link: 0 for link in LINKS.keys()})

def _temp(x, coefficient):
    if(np.isnan(x)):
        return 0
    return x*coefficient

for index, value in DF_SANKEY_MSN["LinksMSN"].iterrows():
    DF_LINKS[value["Link"]] += DF_DATASET[value["MSN"]].transform(lambda x: _temp(x, value["Coefficient"]))


# unpivot data
DF_NODES = pd.melt(frame=DF_NODES, id_vars=["StateCode", "Year"], var_name="Node", value_name="Data")
DF_LINKS = pd.melt(frame=DF_LINKS, id_vars=["StateCode", "Year"], var_name="Link", value_name="Data")


# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

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

# add nodes
for key, value in DATA_NODES.items():
    state, year, node = key
    value = value["Data"]

    # remove NaN values
    if(np.isnan(value) or value <= 0):
        continue

    nodelist = DATA[state][year]["nodelist"]
    nodeid = DATA[state][year]["nodeid"]

    if(node not in nodelist):
        nodeid[node] = len(nodelist)
        nodelist.append(node)
    
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
    if(np.isnan(value) or value <= 0):
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

def groupnodes(sankeydata, nodes : list, kwargs : dict):

    nodelist : list = sankeydata["nodelist"]
    nodeid : dict = sankeydata["nodeid"]
    nodeid[kwargs["node"]] = len(nodelist)
    nodelist.append(node)
    new_node = {
            "node": nodeid[kwargs["node"]],
            "name": kwargs["name"],
            "data": {
                "id": kwargs["node"],
                "value": 0,
            }
        }

    for key in kwargs.keys():
        if(key != "node" and key != "name"):
            new_node["data"][key] = kwargs[key]

    new_nodes = []
    for node in sankeydata["nodes"]:
        if(node["data"]["id"] in nodes):
            new_node["data"]["value"] += node["data"]["value"]
            nodelist.pop(node["data"]["id"])
            nodeid.pop(node["data"]["id"])
        else:
            new_nodes.append(node)
    
    new_links = []
    for link in sankeydata["links"]:
        if(link["data"]["source"] in nodes):
            new_node["data"]["value"] += node["data"]["value"]


# write data to file
open("transformed.json", "w").write(json.dumps(DATA, sort_keys=False, indent='\t'))

# test
open("sankey.json", "w").write(json.dumps(DATA["CA"][2018], sort_keys=False, indent='\t'))

DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

DF_DATASET = DF_DATASET[(DF_DATASET["StateCode"] == "CA") & (DF_DATASET["Year"] == 2018) * (DF_DATASET["MSN"].isin(NEEDED_MSN))]

DF_MSN = pd.read_csv(FILE_MSN)

DF_DATASET = pd.merge(DF_DATASET, DF_MSN, on="MSN")

DF_DATASET.to_csv("log.csv")