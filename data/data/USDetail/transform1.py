import json
import pandas as pd

# parameters

FILE_DATASET = "database.csv"
FILE_DESCRIPTION = "Codes_and_Descriptions.csv"

#  get needed msn

DF_DESCRIPTIONS = pd.read_csv(FILE_DESCRIPTION, encoding='unicode_escape')

NEEDED_DESCRIPTIONS = {
    'Geothermal energy total consumption': "Geothermal",
    'Biomass total consumption': "Biomass",
    'Hydropower total consumption': "Hydropower",
    'Solar energy total consumption': "Solar",
    'Wind energy total consumption': "Wind",
    'Renewable energy total consumption': "TotalRenewable",
    'Total energy consumption': "TotalPrimary"
}

DESCRIPTIONS = DF_DESCRIPTIONS[DF_DESCRIPTIONS["Description"].isin(NEEDED_DESCRIPTIONS.keys())].set_index("MSN").to_dict("index")

NEEDED_MSN = {msn : NEEDED_DESCRIPTIONS[value["Description"]] for msn, value in DESCRIPTIONS.items() }

# select needed years
NEEDED_YEARS = range(2000, 2020)

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["State", "Year", "MSN", "Value"])

# filter dataset

DF_DATASET = DF_DATASET[DF_DATASET["Year"].isin(NEEDED_YEARS) & DF_DATASET["MSN"].isin(NEEDED_MSN.keys())]

DF_DATASET["MSN"] = DF_DATASET["MSN"].transform(lambda x: NEEDED_MSN[x])

DF_DATASET["Value"] = DF_DATASET["Value"].transform(lambda x: float(x))

# transform to dict

DATA = DF_DATASET.groupby("State")[["Year", "MSN", "Value"]].apply(
    lambda x: x.groupby("Year")[["MSN", "Value"]].apply(
        lambda x: x.set_index("MSN")["Value"].to_dict()
    ).to_dict()
).to_dict()

# write to json
open("database.json", "w").write(json.dumps(DATA, sort_keys=False, indent='\t'))


# add others data

for state in DATA.keys():

    for year in DATA[state].keys():

        sum = 0
        
        for item in DATA[state][year].keys():

            if(item != "TotalRenewable" and item != "TotalPrimary"):
                print(DATA[state][year][item])
                sum += DATA[state][year][item]
        
        other = DATA[state][year]["TotalRenewable"] - sum

        if(other < 0):
            other = 0.0
            
        DATA[state][year]["OtherRenewables"] = other

# reformat data

FORMATTED_DATA = { "data" : [] }

for state in DATA.keys():
    state_obj = { 
        "code": state,
        "years": []
    }

    for year in DATA[state].keys():
        year_obj = { 
            "year" : int(year)
        }
        year_obj.update(DATA[state][year])

        state_obj["years"].append(year_obj)
    
    FORMATTED_DATA["data"].append(state_obj)

import json

open("transformed2new.json", "w").write(json.dumps(FORMATTED_DATA, sort_keys=False, indent='\t'))
