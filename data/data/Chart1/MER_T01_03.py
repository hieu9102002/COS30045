import pandas as pd

# Descriptions

SOURCES = [
    'Coal Consumption',
    'Natural Gas Consumption (Excluding Supplemental Gaseous Fuels)',
    'Petroleum Consumption (Excluding Biofuels)',
    'Total Fossil Fuels Consumption',
    'Nuclear Electric Power Consumption',
    'Hydroelectric Power Consumption',
    'Geothermal Energy Consumption',
    'Solar Energy Consumption',
    'Wind Energy Consumption',
    'Biomass Energy Consumption',
    'Total Renewable Energy Consumption',
    'Total Primary Energy Consumption'
]

NOT_AVAILABLE = "Not Available"

df = pd.read_csv("MER_T01_03.csv")


data = {}

for index, value in df.iterrows():
    year = str(value["YYYYMM"])

    if(year[4:6] != "13"):
        continue

    year = year[0:4]

    try:
        data[year]
    except:
        data[year] = {"Year": year}

    data[year].update({value["Description"]: value["Value"]})

data = list(data.values())

df = pd.DataFrame(data=data)



for index, value in df.iterrows():
    for col in SOURCES:
        value[col] = 0 if (value[col] == NOT_AVAILABLE) else float(value[col])

for col in SOURCES:
    df[col + " Percent"] = df[col] / df[SOURCES[-1]]

df.to_csv("transformed1.csv")
