import json
import pandas as pd
from collections import defaultdict

# read data
df = pd.read_csv("select_msn.csv")

data = [value["MSN"] for index, value in df.iterrows()]

print(json.dumps(data, indent=4, sort_keys=False))