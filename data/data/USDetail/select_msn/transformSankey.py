from distutils.errors import LinkError
import json
import pandas as pd
from collections import defaultdict

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"

# select needed msn
NEEDED_MSN = [
    "BDACB",
    "BDLCB",
    "BDFDB",
    "CLACB",
    "CLRCB",
    "CLICB",
    "CLEIB",
    "CLCCB",
    "CCIMB",
    "ELIMB",
    "ESACB",
    "ESRCB",
    "ESICB",
    "LOTCB",
    "ELEXB",
    "ESCCB",
    "EMACB",
    "EMICB",
    "EMCCB",
    "EMLCB",
    "EMFDB",
    "GERCB",
    "GEICB",
    "GEEGB",
    "GECCB",
    "HYICB",
    "HYEGB",
    "HYCCB",
    "CCEXB",
    "NGACB",
    "NGRCB",
    "NGICB",
    "NGEIB",
    "NGCCB",
    "NUEGB",
    "PAACB",
    "PARCB",
    "PAICB",
    "PAEIB",
    "PACCB",
    "SORCB",
    "SOICB",
    "SOEGB",
    "SOCCB",
    "WSICB",
    "WSEIB",
    "WSCCB",
    "WYICB",
    "WYEGB",
    "WYCCB",
    "WDRCB",
    "WDICB",
    "WDEIB",
    "WDCCB",
    "WDPRB",
    "WDEXB",
    "SOTCB",
    "WYTCB",
    "GETCB",
    "HYTCB",
    "WDTCB",
    "WSTCB",
    "BDTCB",
    "EMTCB",
    "NUETB",
    "CLTCB",
    "NGTCB",
    "PATCB",
    "TEEIB",
    "TNACB",
    "TNICB",
    "TNCCB",
    "TNRCB",
    "SFTCB",
    "ELISB",
    "ELNIB",
    "SFRCB",
    "SFINB",
    "SFEIB",
    "SFCCB"
]


# select needed years
NEEDED_YEARS = range(2000, 2020)

# ----------------------------------------------------------------------------------------------------------------
# READ AND FILTER DATA
# ----------------------------------------------------------------------------------------------------------------

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

DF_NODES_CSV = pd.read_csv("sankey_nodes.csv")

NODES = DF_NODES_CSV["node"].drop_duplicates().values

DF_NODES = DF_NODES.assign(**{ node: 0 for node in NODES})

for index, value in DF_NODES_CSV.iterrows():
    DF_NODES[value["node"]] += DF_DATASET[value["calculate"]] * value["times"]


# add links
DF_LINKS = DF_DATASET[["StateCode", "Year"]]

DF_LINKS_CSV = pd.read_csv("sankey_links.csv")

LINKS = DF_LINKS_CSV[["source", "target"]].drop_duplicates().values

Hash_function = lambda source, target: source + "->" + target
Reverse_hash = lambda link: link.split("->")

HASHED_LINKS = [Hash_function(link[0], link[1]) for link in LINKS]

DF_LINKS = DF_LINKS.assign(**{ link: 0 for link in HASHED_LINKS})

for index, value in DF_LINKS_CSV.iterrows():
    DF_LINKS[Hash_function(value["source"], value["target"])] += DF_DATASET[value["calculate"]] * value["times"]



# unpivot data
DF_NODES = pd.melt(frame=DF_NODES, id_vars=["StateCode", "Year"], var_name="node", value_name="Data")
DF_LINKS = pd.melt(frame=DF_LINKS, id_vars=["StateCode", "Year"], var_name="link", value_name="Data")

# ----------------------------------------------------------------------------------------------------------------
# REFORMAT DATA
# ----------------------------------------------------------------------------------------------------------------

# transform to dict
data_nodes = DF_NODES.groupby(["StateCode", "Year", "node"])["Data"].sum().to_dict()

data_links = DF_LINKS.groupby(["StateCode", "Year", "link"])["Data"].sum().to_dict()

# transform tuple key to nested dict

Hash_id = {}

DATA = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
for key, value in data_nodes.items():
    state, year, node = key
    Hash_id[node] = len(DATA[state][year]["nodes"])
    DATA[state][year]["nodes"].append(
        {
            "node": Hash_id[node],
            "name": node,
            "value": value/10000.0,
        }
    )

for key, value in data_links.items():
    state, year, link = key
    DATA[state][year]["links"].append(
        {
            "source": Hash_id[Reverse_hash(link)[0]],
            "target": Hash_id[Reverse_hash(link)[1]],
            "value": value/10000.0,
            "width": value/10000.0
        }
    )

# reformat data
# FORMATTED_DATA = { 
#     "data" : [
#         { 
#             "code": state,
#             "years": [DATA[state][year] for year in DATA[state].keys()]
#         } 
#         for state in DATA.keys()
#     ] 
# }

# write data to file
open("transformed.json", "w").write(json.dumps(DATA["CA"][2017], sort_keys=False, indent='\t'))
