from collections import defaultdict
import pandas as pd
import json

df_info = pd.read_excel("info/info.xlsx", sheet_name="info")

df_order = pd.read_excel("info/info.xlsx", sheet_name="order")

df_info = pd.melt(df_info, id_vars=["value"], var_name="attr", value_name="data")

df_info = df_info.dropna()


data_info = defaultdict(dict)

for k, v in df_info.iterrows():
    data_info[v["value"]][v["attr"]] = v["data"]

    if(v["attr"] == "class" and v["data"] == "order"):
        data_info[v["value"]]["order"] = df_order[v["value"]].dropna().to_list()

    data_info[v["value"]]["value"] = v["value"]


open("info.json", "w").write(json.dumps(data_info, sort_keys=False))