# Entities dataset

This dataset contains a comprehensive list of all countries, entities, each entity's ISO code and group classification. It serves as a conversion of ISO codes between country codes used in [Our World in Data (OWID)](https://ourworldindata.org/)'s datasets, country codes used in [World Bank (WB)'s World Development Indicators (WDI)](https://data.worldbank.org/), and country codes used in the [Internation Monetary Fund (IMF)'s World Economic Outlook (WEO)](https://www.imf.org/en/Publications/WEO/weo-database/2022/April).

The dataset is available in the [entities.csv](/entities.csv) file. We used the [process.py](/process.py) script to collect and process the data.

## Available entities

The entities listed in this dataset consists of entities available in OWID's datasets, WB's WDI, and WEO. For OWID datasets, we select countries from OWID's [Standard entity names](https://github.com/owid/energy-data/tree/master/scripts/input/shared), [World map region definitions](https://ourworldindata.org/world-region-map-definitions), [Energy Dataset](https://github.com/owid/energy-data), and [CO2 Dataset](https://github.com/owid/co2-data)

## Data collection

### Our World in Data

- For OWID's [Standard entity names](https://github.com/owid/energy-data/tree/master/scripts/input/shared), we sourced the data from https://raw.githubusercontent.com/owid/energy-data/master/scripts/input/shared/iso_codes.csv.

- For OWID's [World map region definitions](https://ourworldindata.org/world-region-map-definitions), we went to the [website](https://ourworldindata.org/world-region-map-definitions) and manually downloaded the data available on it.

- For OWID's [Energy Data](https://github.com/owid/energy-data), we sourced the data from https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv.

- For OWD's [CO2 Data](https://github.com/owid/co2-data), we sourced the data from https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv.

### World Bank's World Development Indicators

We used the `get_countries` method from the `world_bank_data` [Python package](https://github.com/mwouts/world_bank_data) to get the list of countries available in WDI. The package is availabe here.

```python
import world_bank_data as wb

df_wb = wb.get_countries()
```

### IMF's World Economic Outlook

We used the `weo` [Python client](https://github.com/epogrebnyak/weo-reader) to get the list of countries available in WEO.

```python
import weo

path, url = weo.download(2022, 1)

df_weo = weo.WEO(path).countries()
```

## Variables

The variables code, definition, and sources are available in our [variables.csv](/variables.csv) file. Below are the details of the variables, i.e., attributes:

| Column          | Description                                                                                                 | Source                              |
| --------------- | ----------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `Code`            | Country Code of all entities in the dataset. We prioritize OWID codes, then WB codes, and finally WEO codes | OWID, WB, WEO                       |
| `Entity`          | The Entity name. We prioritize the shortest, most English Alphabetic name                                   | OWID, WB, WEO                       |
| `OWID`            | Entity's OWID ISO code                                                                                      | OWID                                |
| `OWID_Name`       | Entity's Name according to OWID. The names come from different datasets of OWID                             | OWID                                |
| `OWID_Continent`  | Entity's Continent. Sourced from Our World in Data                                                          | OWID's [World map region definitions](https://ourworldindata.org/world-region-map-definitions) |
| `OWID_WHO_Region` | Entity's WHO region. Sourced from Our World in Data                                                         | OWID's [World map region definitions](https://ourworldindata.org/world-region-map-definitions) |
| `OWID_WB_Region`  | Entity's region according to the World Bank.  Sourced from Our World in Data                                | OWID's [World map region definitions](https://ourworldindata.org/world-region-map-definitions) |
| `OWID_UN_Region`  | Entity's region according to the United Nations. Sourced from Our World in Data.                            | OWID's [World map region definitions](https://ourworldindata.org/world-region-map-definitions) |
| `WB`              | Entity's World Bank ISO3 code                                                                               | WB                                  |
| `WB_ISO2`         | Entity's World Bank ISO2 code                                                                               | WB                                  |
| `WB_Name`         | Entity's name according to the World Bank                                                                   | WB                                  |
| `WB_region`       | Entity's World Bank region                                                                                  | WB                                  |
| `WB_adminregion`  | Entity's World Bank administrative region                                                                   | WB                                  |
| `WB_incomeLevel`  | Entity's income level according to the World Bank                                                           | WB                                  |
| `WB_lendingType`  | Entity's World Bank lending type                                                                            | WB                                  |
| `WB_capitalCity`  | Entity's capital city according to the World Bank                                                           | WB                                  |
| `WB_longitude`    | Entity's capital city according to the World Bank                                                           | WB                                  |
| `WB_latitude`     | Entity's capital city according to the World Bank                                                           | WB                                  |
| `WEO`             | Entity's WEO ISO code                                                                                       | WEO                                 |
| `WEO_Country`     | Entity's name according to the World Economic Outlook                                                       | WEO                                 |
