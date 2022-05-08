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
DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN)]


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

NODESGROUPS = pd.concat( [ DF_SANKEY["Nodes"], DF_SANKEY["Group"] ] )
NODESGROUPS = NODESGROUPS.set_index("Node").to_dict(orient="index")



# add data for group. remove leaf node in the process
NEEDED_GROUP = [
    "BiodieselSum",
    "FuelEthanolSum",
    "Biofuel",
    "WoodWaste",
    "Biomass",
    "NoncombustibleRenewable",
    "Renewable",
    "FossilFuel",
    "Nonrenewable",
    "Clean",
    "Total",
]

for group in GROUPMAP.keys():
    if(group not in NEEDED_GROUP):
        continue
    DF_NODES[group] = DF_NODES[GROUPMAP[group]["nodes"]].sum(axis=1)
    NODES[group] = NODESGROUPS[group]
    


# ----------------------------------------------------------------------------------------------------------------
# UNPIVOT DATA
# ----------------------------------------------------------------------------------------------------------------

DF_NODES = pd.melt(frame=DF_NODES, id_vars=["StateCode", "Year"], var_name="Node", value_name="Data")

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

# remove uneccesary nodes
REMOVE_NODES = [
    "ElectricPower",
    "Transportation",
    "Industrial",
    "Commercial",
    "Residential",
    "ElectricLoss",
    "ElectricImport",
    "WoodProduction",
    "BiodieselSum",
    "Biofuel",
    "WoodWaste",
    "ElectricExport",
    "CoalCokeImport",
    "CoalCokeExport",
    "DensifiedBiomassExport",
    "NetInterstateExport",
    "NetInterstateImport",
]

# transform to dict
DATA_NODES = DF_NODES.set_index(keys=["StateCode", "Year", "Node"]).to_dict(orient="index")

# transform tuple key to nested dict
DATA = defaultdict(lambda: defaultdict(dict))
for key, value in DATA_NODES.items():
    state, year, node = key
    value = value["Data"]

    if(node in REMOVE_NODES):
        continue

    if(np.isnan(value) or value <= 0):
        value = 0
    
    DATA[state][year]["year"] = year
    DATA[state][year][node] = value

# reformat data
FORMATTED_DATA = { 
    "data" : [
        { 
            "code": state,
            "years": [DATA[state][year] for year in DATA[state].keys()]
        } 
        for state in DATA.keys()
    ] 
}

# write data to file
open("transformed.json", "w").write(json.dumps(FORMATTED_DATA, sort_keys=False, indent='\t'))
