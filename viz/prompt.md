This is a good start. Now, I will share image links for figures with descriptions of what they are. Please place the images as figures and write captions from my descriptions.

# Research Questions

This analysis focuses on understanding zoning patterns and their implications for urban planning.
We aim to answer the following questions:

1. **How do zoning classifications correlate with demographic and economic indicators?**
2. **Are there spatial trends in zoning policies that indicate socioeconomic disparities?**
3. **What insights can be drawn about land use and development patterns from zoning data?**

These questions will guide our data processing, visualization, and statistical analysis.

# Figures
1. [](https://i.imgur.com/KdQvFhU.png) Upon comparing the number of municipalities with the number of unique municipalities, we find that there are 52 duplicate municipalities. This might be due to a double entry error, or multiple municipal entities in the same geographical location. For the remainder of the exercise, we assume that the duplication arises from an error.This figure displays the comparisons of numeric columns for Brookline. 52 municipalities have duplicate entries. Here we visualize Brookline with red and blue displaying values from different instances.

2. [](https://i.imgur.com/45PHfdb.png) We observe that Brookline, like other duplicate municipalities, has different shape files corresponding to different instances. Here, we also observe that the shapes are not just boundaries. They include other features that clutter our visualization.

3. [](https://i.imgur.com/4bRRXpa.png) To avoid visual clutter, we used shapes from the provided `metro_boston_municipalities.geojson`. We joined this to our main `housing_sf_other_w_census.geojson` dataset using the `muni` field.

4. [](https://i.imgur.com/nRrgGzz.png) We observe minimum and maximum populations and find out that multiple municipalities have populations of 0. We will repeat this observation after combining duplicate municipalities. We see here that 16 municipalities have 0 population. We later find that a majority of these instances are from duplicate entries. We combine duplicate entries by summing their quantity values and averaging percentages.

5. [](https://i.imgur.com/W33Poyr.png) Even after combining duplicate entries, we find that 5 municipalities have 0 family households.

6. [](https://i.imgur.com/OuNKUcl.png) Plotting family households against population, we find that Burlington, Chelsea, Everett and Somerville have 0 family households. We later find that these municipalities have 0 population, even after the merge. We filter these entries for further work.

7. [](https://i.imgur.com/DP1dtNe.png) Here we visualize a histogram of population underlining municipalities with minimum, median and maximum values. We confirm the filter operation via a histogram of number of municipalities against population.

8. [](https://i.imgur.com/U5Oj689.png) For a preliminary check to evaluate income against racial distribution, we look at households with income under \$10,000.

9. [](https://i.imgur.com/24WG8vT.png) This is a more experimental violin plot of the same distribution with mean and median values visualized.

10. [](https://i.imgur.com/Cwz1hzP.png) Here is another experimentation with the same plot.

11. [](https://i.imgur.com/eIybmLw.png) We visualize the number of households earning over \$200,000.

12. [](https://i.imgur.com/yWGI19x.png) 

The `Distribution of Households Across Income Brackets` chart above presents the **average number of households** across different income brackets. One **unexpected** observation stands out:

- **The Highest Income Bracket Has the Greatest Number of Households**   
  Unlike typical income distributions, where middle-income brackets often dominate, this dataset suggests that **households earning over $200,000 per year** are the most common.  

- **The Median Income Bracket Has the Fewest Households**  
  Few households report incomes in the lowest bracket, which could reflect economic conditions in the studied region.

**Possible Explanations for the Wealth-Dominant Trend**
a. **Boston Metropolitan Area is Wealthier than Expected**  
   The dataset might reflect the high-income nature of the region, especially with affluent suburbs included.
   
b. **The Income Brackets are Capped**  

   The highest income bracket is **\$200,000 and above**, meaning it could be absorbing households making much more (e.g., \$500K, \$1M+). A lack of finer granularity at the high end limits visibility into true income distribution.

c. **The Dataset May Need Inflation Adjustment**  
   If the dataset was created several years ago, the income brackets might not accurately reflect today's purchasing power. Adjusting for **inflation** might shift the balance of household distribution across brackets.

13. [](https://i.imgur.com/IowyQeD.png) We use the information below to compute a low income threshold and transform data accordingly.
Massachusetts median income is $101,341 ([census.gov](https://www.census.gov/quickfacts/fact/table/MA/INC110223)).

Poverty line is 60% of state median income ([masslegalhelp.org](https://www.masslegalhelp.org/housing-apartments-shelter/public-subsidized-housing/federal-poverty-guidelines)).

14. [](https://i.imgur.com/GqBzYwX.png) 
**Correlation Between Race & Income**
This heatmap visualizes the relationships between:
- **Percentage of Low-Income Households**
- **Percentage of High-Income Households**
- **Percentage of Black or African American Households**
- **Percentage of White Households**

15. [](https://i.imgur.com/eOxH9re.png)

**Key Insights**
🔹 **Strongest Negative Correlation** → `perc_white` vs. `perc_low_inc`  
   - Suggests that municipalities with a higher percentage of White households tend to have **fewer** low-income households.
  
🔹 **Strongest Positive Correlation** → `perc_black_` vs. `perc_low_inc`  
   - Indicates that areas with a higher percentage of Black households **tend to have more low-income households**.

🔹 **Weak or Mixed Correlations**  
   - `perc_black_` vs. `perc_high_inc` is weaker, implying income diversity among Black households across municipalities.

**What This Tells Us**
- **Economic disparities exist** across racial lines.
- **Other factors need to be considered** (education, housing policies, urban planning) to fully understand these relationships.
- **Further Investigation Needed** → Is this correlation causal or reflective of larger systemic factors?

While correlation does **not imply causation**, these patterns **warrant deeper analysis into socioeconomic factors** that shape economic disparities.
