import json
import pandas as pd
from collections import defaultdict

# parameters
FILE_DATASET = "complete_seds.csv"

# columns
COLUMNS = ["Data_Status", "MSN", "StateCode", "Year", "Data"]

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])

# transform to Series. Values of this series can be used similar to dict: DATA[state][year][msn] -> value
DATA = DF_DATASET.groupby(["StateCode", "Year", "MSN"])["Data"].sum()

# transform to tupled-key dict
DATA = DATA.to_dict()

# transform tuple key to nested dict
d = defaultdict(lambda: defaultdict(dict))
for key, value in DATA.items():
    state, year, msn = key
    d[state][year][msn] = value
DATA = d

# write to json
open("database.json", "w").write(json.dumps(DATA.to_dict(), sort_keys=False, indent='\t'))