import json
import pandas as pd

# parameters
FILE_DATASET = "complete_seds.csv"

# columns
COLUMNS = ["Data_Status", "MSN", "StateCode", "Year", "Data"]

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# transform to dict
DATA = DF_DATASET.groupby("StateCode")[["Year", "MSN", "Data"]].apply(
    lambda x: x.groupby("Year")[["MSN", "Data"]].apply(
        lambda x: x.set_index("MSN")["Data"].to_dict()
    ).to_dict()
).to_dict()

# write to json
open("database.json", "w").write(json.dumps(DATA, sort_keys=False, indent='\t'))