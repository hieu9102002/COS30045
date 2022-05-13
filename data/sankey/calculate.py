import json
import numpy as np
import pandas as pd
from collections import defaultdict
from transformGroupSum import transformGroupSum
# Mnemonic Series Names (MSN) - EIA

# ----------------------------------------------------------------------------------------------------------------
# PARAMETERS
# ----------------------------------------------------------------------------------------------------------------

NEEDED_GROUP = ["Biomass", "Nonrenewable"]
REMOVE_NODES = ["WoodProduction", "Nonrenewable", "CoalCokeImport", "CoalCokeExport", "DensifiedBiomassExport", "ElectricLoss"]
# , "Nuclear", "Petroleum", "Coal", "NaturalGas", "ElectricLoss", "ElectricImport", "ElectricExport", "NetInterstateImport", "NetInterstateExport"]

NEEDED_STATE = "US"
NEEDED_YEAR = 2019

NEEDED_YEARS = range(2000, 2020)

FILE_DATASET = "complete_seds.csv"
FILE_SANKEY = "sankey.xlsx"

# ----------------------------------------------------------------------------------------------------------------
# READ AND FILTER DATA
# ----------------------------------------------------------------------------------------------------------------

# read sankey and select needed MSNs
DF_SANKEY = pd.read_excel(FILE_SANKEY, sheet_name=['Nodes', 'Links', 'MSN', 'Group', 'GroupSum'])

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# select needed years
needed_years = NEEDED_YEARS

# select needed msn
needed_msn = DF_SANKEY["MSN"].loc[:, "MSN"].drop_duplicates().values.tolist()

# filter dataset
DF_DATASET = DF_DATASET[
    DF_DATASET["Year"].isin(needed_years)
    &
    DF_DATASET["MSN"].isin(needed_msn)
]


# ----------------------------------------------------------------------------------------------------------------
# PIVOT DATA
# ----------------------------------------------------------------------------------------------------------------

# pivot dataframe
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())

# ----------------------------------------------------------------------------------------------------------------
# ADD DATA
# ----------------------------------------------------------------------------------------------------------------

# create a new DataFrame for values
DF_DATAVALUES = DF_DATASET[["StateCode", "Year"]]


# initialize each column with value 0
DF_DATAVALUES = DF_DATAVALUES.assign(**{row["id"]: 0 for index, row in DF_SANKEY["MSN"].iterrows()})

# calculate each column by adding data
for index, row in DF_SANKEY["MSN"].iterrows():
    DF_DATAVALUES.loc[:, row["id"]] += DF_DATASET.loc[:, row["MSN"]] * row["Coefficient"]

del DF_DATASET

# ----------------------------------------------------------------------------------------------------------------
# CALCULATE GROUPS
# ----------------------------------------------------------------------------------------------------------------


# trasform groupsum table to 3 dicts: 
# one records array of leafs (all groups (nodes) that have no child nodes and have already been calculated with MSN), 
# one records array of all descendants, 
# one records array of all ancestors
GROUPSUM_DICT : dict[str, dict]= transformGroupSum(DF_GROUPSUM=DF_SANKEY["GroupSum"])

for group, leafs in GROUPSUM_DICT["leafs_of"].items():
    DF_DATAVALUES.loc[:, group] = DF_DATAVALUES.loc[:, leafs].sum(axis=1)

# ----------------------------------------------------------------------------------------------------------------
# FINISH CALCULATING MSNS. UNPIVOT AND SAVE DATA
# ----------------------------------------------------------------------------------------------------------------

DF_DATAVALUES.to_csv("values.csv")

DF_DATAVALUES = pd.melt(frame=DF_DATAVALUES, id_vars=["StateCode", "Year"], var_name="MSN", value_name="Data")

DF_DATAVALUES.to_csv("valuesmelt.csv")

# ----------------------------------------------------------------------------------------------------------------
# LOAD DETAILS
# ----------------------------------------------------------------------------------------------------------------

NODES_DETAILS : pd.DataFrame = pd.concat([DF_SANKEY["Nodes"], DF_SANKEY["Group"]]).set_index("node")

NODES_DETAILS.to_json(path_or_buf="nodes.json", orient="index")
NODES_DETAILS = NODES_DETAILS.to_dict("index")

LINKS_DETAILS = DF_SANKEY["Links"].set_index("id").to_dict("index")


DF_DATANODES = DF_DATAVALUES[DF_DATAVALUES["MSN"].isin(NODES_DETAILS.keys())]

# ----------------------------------------------------------------------------------------------------------------
# TRANSFORM LINKS TO FLOW
# ----------------------------------------------------------------------------------------------------------------

# filter datavalues to calculate
DF_DATAFLOWS = DF_DATAVALUES[DF_DATAVALUES["MSN"].isin(LINKS_DETAILS.keys())]

DF_DATAFLOWS.loc[:, "MSN"] = DF_DATAFLOWS.loc[:, "MSN"].transform(lambda x: (x.split("->")))

import itertools

def _add_flow_by_group(dataframe : pd.DataFrame):
    for index, row in dataframe.iterrows():
        rowparents = [GROUPSUM_DICT["ancestors_of"].get(msn, []) + [msn] for msn in row["MSN"]]
        x = list(itertools.product(*rowparents))
        print(x)

DF_DATAFLOWS.groupby(["StateCode", "Year"])[["MSN", "Data"]].apply(_add_flow_by_group)