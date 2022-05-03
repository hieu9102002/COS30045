import json
import pandas as pd

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"

#  get needed msn
NEEDED_MSN = {
    'GETCB': "Geothermal",
    'BMTCB': "Biomass",
    'HYTCB': "Hydropower",
    'SOTCB': "Solar",
    'WYTCB': "Wind",
    'RETCB': "TotalRenewable",
    'TETCB': "TotalPrimary"
}

# select needed years
NEEDED_YEARS = range(2000, 2020)

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# filter dataset
DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN.keys())]
DF_DATASET["MSN"] = DF_DATASET["MSN"].transform(lambda x: NEEDED_MSN[x])
DF_DATASET["Data"] = DF_DATASET["Data"].transform(lambda x: float(x))

# add other renewables data

# pivot data
DF_DATASET = DF_DATASET.pivot(index=["StateCode", "Year"], columns=["MSN"], values=["Data"])["Data"]

# change to normal dataframe
# https://stackoverflow.com/questions/43756052/transform-pandas-pivot-table-to-regular-dataframe
DF_DATASET = pd.DataFrame(DF_DATASET.to_records())

# add other renewables data
DF_DATASET['OtherRenewables'] = DF_DATASET['TotalRenewable']

for msn in NEEDED_MSN.values():
    if(msn != "TotalRenewable" and msn != "TotalPrimary"):
        DF_DATASET['OtherRenewables'] -= DF_DATASET[msn]

DF_DATASET['OtherRenewables'] = DF_DATASET['OtherRenewables'].transform(lambda x: 0 if x < 0 else x)

# DF_DATASET["Parts"] = DF_DATASET["MSN"].transform(lambda x: 2 if x == "TotalPrimary" else 1 if x == "TotalRenewable" else 0)

# # DF_DATASET.groupby(["StateCode", "Year"]).sum()

DF_DATASET.to_csv("new.csv")

# # reformat data

# FORMATTED_DATA = { "data" : [] }

# for state in DATA.keys():
#     state_obj = { 
#         "code": state,
#         "years": []
#     }

#     for year in DATA[state].keys():
#         year_obj = { 
#             "year" : int(year)
#         }
#         year_obj.update(DATA[state][year])

#         state_obj["years"].append(year_obj)
    
#     FORMATTED_DATA["data"].append(state_obj)



# open("transformed.json", "w").write(json.dumps(FORMATTED_DATA, sort_keys=False, indent='\t'))
