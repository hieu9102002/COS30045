from collections import defaultdict
import pandas as pd
import json

df_info = pd.read_excel("info.xlsx", sheet_name="info")

df_info = pd.melt(df_info, id_vars=["value"], var_name="attr", value_name="data")

df_info = df_info.dropna()


data_info = defaultdict(dict)

for k, v in df_info.iterrows():
    data_info[v["value"]][v["attr"]] = v["data"]
    data_info[v["value"]]["value"] = v["value"]


open("info.json", "w").write(json.dumps(data_info, indent=4, sort_keys=False))