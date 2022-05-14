import json
import numpy as np
import pandas as pd
from collections import defaultdict
from utils import transformGroupSum, writejson
# Mnemonic Series Names (MSN) - EIA

# ----------------------------------------------------------------------------------------------------------------
# PARAMETERS
# ----------------------------------------------------------------------------------------------------------------

NEEDED_YEARS = range(2000, 2020)

# ----------------------------------------------------------------------------------------------------------------
# READ SANKEY DETAILS
# ----------------------------------------------------------------------------------------------------------------

# read sankey and select needed MSNs
DF_SANKEY = pd.read_excel("sankey.xlsx", sheet_name=['Nodes', 'Links', 'MSN', 'Groups', 'GroupSum'])

# ----------------------------------------------------------------------------------------------------------------
# WRITE GROUPS DETAILS
# ----------------------------------------------------------------------------------------------------------------

# trasform groupsum table to 3 dicts: 
# one records array of leafs (all groups (nodes) that have no child nodes and have already been calculated with MSN), 
# one records array of all descendants, 
# one records array of all ancestors
GROUPSUM_DICT : dict[str, dict]= transformGroupSum(DF_GROUPSUM=DF_SANKEY["GroupSum"])
# writejson(GROUPSUM_DICT, "groups.json")

# ----------------------------------------------------------------------------------------------------------------
# WRITE ATTRIBUTES (NODES, GROUPS, LINKS) DETAILS
# ----------------------------------------------------------------------------------------------------------------

NODES_DETAILS = DF_SANKEY["Nodes"].fillna("").set_index("node").to_dict("index")
GROUPS_DETAILS = DF_SANKEY["Groups"].fillna("").set_index("node").to_dict("index")
LINKS_DETAILS = DF_SANKEY["Links"].fillna("").set_index("link").to_dict("index")

ATTR_DETAILS = {
    **LINKS_DETAILS,
    **NODES_DETAILS,
    **GROUPS_DETAILS
}

writejson(ATTR_DETAILS, "attr.json")

# ----------------------------------------------------------------------------------------------------------------
# CALCULATE AND STORE VALUES
# ----------------------------------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------------------------------
# READ AND FILTER DATA VALUES
# ----------------------------------------------------------------------------------------------------------------

# read data
DF_DATASET = pd.read_csv("complete_seds.csv", usecols=["StateCode", "Year", "MSN", "Data"])

# select needed years
needed_years = NEEDED_YEARS

# select needed msn
needed_msn = DF_SANKEY["MSN"].loc[:, "MSN"].drop_duplicates().values.tolist()

# filter dataset
DF_DATASET = DF_DATASET[
    # DF_DATASET["Year"].isin(needed_years)
    # &
    DF_DATASET["MSN"].isin(needed_msn)
]

# ----------------------------------------------------------------------------------------------------------------
# CALCULATE DATA VALUES
# ----------------------------------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------------------------------
# PIVOT DATA
# ----------------------------------------------------------------------------------------------------------------

# pivot dataframe
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())

# ----------------------------------------------------------------------------------------------------------------
# CALCULATE NODES DATA WITH MSN
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

for group, leafs in GROUPSUM_DICT["leafs_of"].items():
    DF_DATAVALUES.loc[:, group] = DF_DATAVALUES.loc[:, leafs].sum(axis=1)

# ----------------------------------------------------------------------------------------------------------------
# FINISH CALCULATING MSNs. UNPIVOT AND SAVE DATA
# ----------------------------------------------------------------------------------------------------------------

DF_DATAVALUES = pd.melt(frame=DF_DATAVALUES, id_vars=["StateCode", "Year"], var_name="MSN", value_name="Data")

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

# ----------------------------------------------------------------------------------------------------------------
# ADD ATTRIBUTES COLUMN
# ----------------------------------------------------------------------------------------------------------------

def _temp(msn):
    if(msn in LINKS_DETAILS.keys()):
        return "links"
    elif(msn in GROUPS_DETAILS.keys()):
        return "nodes"
    elif(msn in NODES_DETAILS.keys()):
        return "nodes"
    return 0


DF_DATAVALUES.loc[:, "Attr"] = DF_DATAVALUES.loc[:, "MSN"].transform(lambda x: _temp(x))

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT AND WRITE DATA
# ----------------------------------------------------------------------------------------------------------------

DATAVALUES_RECARRAY = DF_DATAVALUES.to_records(index=False)

DATAVALUES = defaultdict(
    lambda: defaultdict(
        lambda: defaultdict(
            lambda: {}
        )
    )
)

for value in DATAVALUES_RECARRAY:
    state = str(value["StateCode"])
    year = str(value["Year"] )
    attr = str(value["Attr"] )
    msn = str(value["MSN"])
    value = value["Data"]

    # remove NaN values
    if(np.isnan(value) or value < 0):
        continue

    DATAVALUES[state][year][attr][msn] = value

writejson(DATAVALUES, "values.json")


# ----------------------------------------------------------------------------------------------------------------
# WRITE ALL DATA TO A JSON FILE
# ----------------------------------------------------------------------------------------------------------------

writejson({
    "attr": ATTR_DETAILS,
    "groups": GROUPS_DETAILS,
    "data": DATAVALUES
}, "data.json")