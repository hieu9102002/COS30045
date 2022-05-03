# check if msn.csv and Codes_and_Descriptions.csv are the same

import pandas as pd
f = pd.read_csv("msn.csv")
g = pd.read_csv("Codes_and_Descriptions.csv", encoding='unicode_escape')

x = f == g

for index, value in x.iterrows():
    for col in x.columns:
        if(value[col] == False):
            print(value)
