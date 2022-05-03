import json
import pandas as pd
from collections import defaultdict

# filenames
FILE_DATASET = "complete_seds.csv"
FILE_MSN = "msn.csv"
FILE_STATECODE = "statecode.csv"

# read data
DF_DATASET = pd.read_csv(FILE_DATASET, usecols=["StateCode", "Year", "MSN", "Data"])
DF_MSN = pd.read_csv(FILE_MSN)

DF_DATASET = DF_DATASET[(DF_DATASET["StateCode"] == "US") & (DF_DATASET["Year"] == 2019)]

df = pd.merge(DF_DATASET, DF_MSN, on="MSN")

df.to_csv("new.csv")