from collections import defaultdict
import math
import pandas as pd
import numpy as np


df_owid = pd.read_csv("land-area-km.csv")

df_wb = pd.read_csv("world-bank-area.csv")

df_wb = pd.melt(df_wb, id_vars=["country", "iso_code"],
                var_name="year", value_name="area2")

df_owid = df_owid[["iso_code", "year", "area"]].dropna()
df_wb = df_wb[["iso_code", "year", "area2"]].dropna()

df_owid["year"] = df_owid["year"].transform(lambda y: int(y))
df_wb["year"] = df_wb["year"].transform(lambda y: int(y))

df = pd.merge(df_owid, df_wb, on=["year", "iso_code"], how="outer")


df["area"] = df[["area", "area2"]].max(axis=1)

for k, v in df.iterrows():
    if(math.isnan(v["area"])):
        print(v)

df = df[["iso_code", "year", "area"]]

df.to_csv("land-area.csv", index=False)