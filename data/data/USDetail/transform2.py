import pandas as pd

DF_DATA_ORIGINAL = pd.read_csv("use_all_btu.csv")

DF_DESCRIPTIONS = pd.read_csv("Codes_and_Descriptions.csv", encoding='unicode_escape')


NON_YEAR_COLUMNS = [ "Data_Status", "State" , "MSN" ]

YEAR_COLUMNS = [str(col) for col in list(DF_DATA_ORIGINAL.columns) if col not in NON_YEAR_COLUMNS]



NEEDED_DESCRIPTIONS = {
    'Geothermal energy total consumption' : "Geothermal",
    'Biomass total consumption' : "Biomass",
    'Hydropower total consumption' : "Hydropower",
    'Solar energy total consumption' : "Solar",
    'Wind energy total consumption' : "Wind",
    'Renewable energy total consumption' : "TotalRenewable",
    'Total energy consumption' : "TotalPrimary"
}



NEEDED_YEARS = range(2002, 2020)

YEARS = [ str(year) for year in NEEDED_YEARS if str(year) in YEAR_COLUMNS ]

DATA = {}

#  get needed msn

NEEDED_MSN = {}

for index, value in DF_DESCRIPTIONS.iterrows():
    
    description = value["Description"]
    msn = value["MSN"]
    
    if(description in NEEDED_DESCRIPTIONS.keys()):
        NEEDED_MSN[msn] = NEEDED_DESCRIPTIONS[description]
        


for index, row in DF_DATA_ORIGINAL.iterrows():
    
    state = row["State"]

    msn = row["MSN"]

    if(msn not in NEEDED_MSN.keys()):
        continue
    
    try:
        DATA[state]
    except:
        DATA[state] = {}

    for year in YEARS:

        value = row[year]

        try:
            DATA[state][year]
        except:
            DATA[state][year] = {}
        
        DATA[state][year].update({NEEDED_MSN[msn] : float(value)})

# add others

for state in DATA.keys():

    for year in DATA[state].keys():

        sum = 0
        
        for item in DATA[state][year].keys():

            if(item != "TotalRenewable" and item != "TotalPrimary"):
                sum += DATA[state][year][item]
        
        other = DATA[state][year]["TotalRenewable"] - sum

        if(other < 0):
            other = 0.0
            
        DATA[state][year]["OtherRenewables"] = other

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