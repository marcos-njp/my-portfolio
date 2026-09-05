# Requirements Document

## Introduction

The CSV Data Profiler is an interactive playground added to the portfolio at `/playground/data-profiler`. A visitor supplies a CSV file (uploaded from their machine or selected from curated sample datasets) and the feature parses it in the browser, derives a statistical profile of every column, recommends and renders charts from that profile, computes a data quality score with cleaning recommendations, generates an AI narrative from the derived profile only, and exports the whole result as a Markdown or JSON report.

The feature demonstrates data analysis capability rather than prompt engineering. A deliberate architectural constraint is that the AI narrative is produced from schema and aggregated statistics only. No raw data row and no visitor-authored free text ever reaches the language model, which removes prompt injection as a threat by construction rather than by filtering.

## Glossary

- **Profiler_UI**: The client-side React page and its components rendered at the `/playground/data-profiler` route.
- **CSV_Parser**: The client-side module that converts CSV text into a Parsed_Dataset.
- **Parsed_Dataset**: An in-memory structure holding the header names, the retained data rows, the total row count read from the file, and the retained row count.
- **Type_Inferencer**: The module that assigns exactly one Column_Type to each column of a Parsed_Dataset, using the Accepted_Date_Formats when evaluating date values.
- **Accepted_Date_Formats**: The set of date representations the Type_Inferencer parses, consisting of ISO 8601 dates and the formats `YYYY-MM-DD`, `MM/DD/YYYY`, and `DD/MM/YYYY`, where a value parseable as both `MM/DD/YYYY` and `DD/MM/YYYY` is interpreted as `MM/DD/YYYY`.
- **Column_Type**: One of the values `numeric`, `categorical`, `datetime`, `identifier`, or `unknown`.
- **Profiler**: The client-side module that computes a Data_Profile from a Parsed_Dataset and its Column_Type assignments.
- **Column_Profile**: The derived record for a single column, containing the column name, Column_Type, null count, non-null count, distinct value count, and the type-specific statistics defined in Requirement 3.
- **Data_Profile**: The complete derived result for a Parsed_Dataset, containing the retained row count, the total row count, the duplicate row count, the ordered list of Column_Profile records, the list of Correlation_Pair records, and the Quality_Score.
- **Correlation_Pair**: A record holding two numeric column names and the Pearson correlation coefficient between those two columns.
- **Outlier**: A value in a numeric column that lies below Q1 minus 1.5 times the interquartile range or above Q3 plus 1.5 times the interquartile range.
- **Chart_Recommender**: The module that derives an ordered list of Chart_Spec records from a Data_Profile.
- **Chart_Spec**: A record declaring a chart type, the source column names, and the aggregated series values required to render one chart.
- **Quality_Scorer**: The module that computes the Quality_Score and the Cleaning_Recommendation list from a Data_Profile.
- **Quality_Score**: An integer from 0 through 100 inclusive summarizing dataset health.
- **Cleaning_Recommendation**: A record naming an affected column, a detected issue category, and a remediation action.
- **Insight_Service**: The server-side API route at `/api/profile-insights` that returns an Insight_Narrative.
- **Insight_Payload**: The JSON request body sent to the Insight_Service, containing only fields derived from a Data_Profile.
- **Insight_Narrative**: The structured AI-generated result containing a summary, a list of observations, and a list of suggested next analyses.
- **Report_Exporter**: The module that serializes a Data_Profile and an Insight_Narrative into a Markdown document or a JSON document.
- **Sample_Dataset**: One of the curated CSV files bundled with the application and selectable without an upload.
- **Row_Cap**: The maximum number of data rows retained for profiling, fixed at 50,000.
- **Size_Cap**: The maximum accepted upload file size, fixed at 5 megabytes.

## Requirements

### Requirement 1: CSV Intake

**User Story:** As a portfolio visitor, I want to supply a CSV file by upload or by picking a sample, so that I can profile a dataset without preparing my own data first.

#### Acceptance Criteria

1. THE Profiler_UI SHALL present a file selection control that accepts files with the `.csv` extension and a list of between 1 and 10 available Sample_Dataset entries, each entry labeled with its name and its data row count.
2. WHEN a visitor selects a Sample_Dataset, THE Profiler_UI SHALL load the corresponding bundled CSV text and pass the CSV text to the CSV_Parser within 1 second of the selection.
3. WHEN a visitor selects a file whose size is greater than 0 bytes and at most the Size_Cap of 5 megabytes, THE CSV_Parser SHALL read the file contents in the browser and produce a Parsed_Dataset.
4. IF a visitor selects a file whose size exceeds the Size_Cap of 5 megabytes, THEN THE Profiler_UI SHALL reject the file without reading its contents, SHALL display the Size_Cap value in megabytes and the size of the rejected file in megabytes rounded to 2 decimal places, and SHALL retain the previously displayed Data_Profile.
5. IF a visitor selects a file whose extension is not `.csv`, THEN THE Profiler_UI SHALL reject the file without reading its contents, SHALL display a message naming `.csv` as the accepted extension, and SHALL retain the previously displayed Data_Profile.
6. THE CSV_Parser SHALL execute in the browser for every Parsed_Dataset it produces.
7. WHEN the file contains more data rows than the Row_Cap of 50,000, THE CSV_Parser SHALL retain the first 50,000 data rows in the Parsed_Dataset, SHALL discard the remaining data rows, SHALL record the total data row count read from the file, and THE Profiler_UI SHALL display a notice stating the retained row count and the total row count.
8. WHILE the CSV_Parser is reading a file, THE Profiler_UI SHALL display a progress indicator showing the percentage of bytes read as a whole number from 0 to 100, updated at least once per 500 milliseconds.
9. IF the selected file contains zero data rows, THEN THE Profiler_UI SHALL display a message stating that the file contains no data rows and SHALL retain the previously displayed Data_Profile.
10. IF the CSV_Parser encounters a data row whose field count differs from the header field count, THEN THE CSV_Parser SHALL record the row index and both field counts in a parse issue list and SHALL continue parsing the remaining data rows.
11. WHEN parsing completes with a non-empty parse issue list, THE Profiler_UI SHALL display the total number of entries in the parse issue list and the first 10 recorded row indices, and SHALL display the Data_Profile produced from the Parsed_Dataset.
12. WHEN the CSV_Parser produces a Parsed_Dataset, serializing that Parsed_Dataset to CSV text and parsing that CSV text SHALL produce a Parsed_Dataset with identical header names in identical order and identical retained data row values.
13. THE Profiler_UI SHALL transmit zero data rows and zero file contents to any server endpoint.
14. IF the CSV_Parser cannot read the selected file, or reading does not complete within 60 seconds, THEN THE Profiler_UI SHALL stop reading, SHALL display an error message indicating that the file could not be read, and SHALL retain the previously displayed Data_Profile.
15. IF the first row of the selected file contains zero fields, an empty field name, or duplicate field names, THEN THE Profiler_UI SHALL reject the file, SHALL display an error message indicating that the header row requires unique non-empty field names, and SHALL retain the previously displayed Data_Profile.

### Requirement 2: Column Type Inference

**User Story:** As a portfolio visitor, I want each column classified automatically, so that I do not have to declare data types before seeing results.

#### Acceptance Criteria

1. WHEN a Parsed_Dataset containing at most 100,000 rows and at most 100 columns is available, THE Type_Inferencer SHALL assign exactly one Column_Type to each column of that Parsed_Dataset within 3 seconds.
2. WHERE at least 95 percent of the non-null values in a column parse as finite numbers, excluding values that parse to infinity or not-a-number, THE Type_Inferencer SHALL assign the Column_Type `numeric` to that column.
3. WHERE at least 95 percent of the non-null values in a column parse as ISO 8601 dates or as dates in the formats `YYYY-MM-DD`, `MM/DD/YYYY`, or `DD/MM/YYYY`, THE Type_Inferencer SHALL assign the Column_Type `datetime` to that column, and WHERE a value is parseable as both `MM/DD/YYYY` and `DD/MM/YYYY`, THE Type_Inferencer SHALL interpret that value as `MM/DD/YYYY`.
4. WHERE the distinct value count of a column equals the non-null value count of that column and the non-null value count is at least 20, THE Type_Inferencer SHALL assign the Column_Type `identifier` to that column.
5. WHERE a column matches none of the `numeric`, `datetime`, or `identifier` conditions and the distinct value count of that column is at most 50 percent of the non-null value count, THE Type_Inferencer SHALL assign the Column_Type `categorical` to that column.
6. WHERE a column matches none of the `numeric`, `datetime`, `identifier`, or `categorical` conditions, THE Type_Inferencer SHALL assign the Column_Type `unknown` to that column.
7. IF a column contains zero non-null values, THEN THE Type_Inferencer SHALL assign the Column_Type `unknown` to that column and SHALL evaluate no other Column_Type condition for that column.
8. WHEN the Type_Inferencer has assigned a Column_Type to every column of the Parsed_Dataset, THE Profiler_UI SHALL display the assigned Column_Type value for each column adjacent to that column's name, including columns assigned the Column_Type `unknown`.
9. THE Type_Inferencer SHALL assign the same Column_Type to a given column of a Parsed_Dataset regardless of the order of the data rows in that Parsed_Dataset.
10. WHEN evaluating a column, THE Type_Inferencer SHALL evaluate the Column_Type conditions in the fixed precedence order `numeric`, `datetime`, `identifier`, `categorical`, `unknown`, and SHALL assign the Column_Type of the first condition that is satisfied.
11. THE Type_Inferencer SHALL treat a value as null when the value is absent, is an empty string, or consists only of whitespace characters, and SHALL exclude such values from both the non-null value count and the distinct value count of a column.
12. IF the Type_Inferencer cannot complete Column_Type assignment for a column because the Parsed_Dataset exceeds 100,000 rows or 100 columns, or because evaluation of that column fails, THEN THE Type_Inferencer SHALL assign the Column_Type `unknown` to that column, SHALL retain the Column_Type assignments already made for the other columns, and THE Profiler_UI SHALL display an indication that the Column_Type for that column could not be determined.

### Requirement 3: Statistical Profiling

**User Story:** As a portfolio visitor, I want per-column statistics computed automatically, so that I can understand the shape of the dataset at a glance.

#### Acceptance Criteria

1. WHEN a Parsed_Dataset and its Column_Type assignments are available, THE Profiler SHALL produce a Data_Profile containing exactly one Column_Profile per column, ordered by the header position of each column in the Parsed_Dataset, within 10 seconds for a Parsed_Dataset of up to the Row_Cap rows and up to 200 columns.
2. THE Profiler SHALL record in every Column_Profile the null count as the number of retained rows whose value for that column is an empty string or contains only whitespace, the non-null count as the number of remaining retained rows, and the distinct value count as the number of distinct non-null values compared as exact case-sensitive strings.
3. WHERE a Column_Profile has the Column_Type `numeric`, THE Profiler SHALL compute over the non-null values of that column which parse as finite numbers and SHALL record the minimum, maximum, mean, median, standard deviation, first quartile, third quartile, and the count of Outlier values, with the first quartile, median, and third quartile obtained by linear interpolation between the two closest ranks of the ascending sorted values, and with every recorded statistic rounded to 6 decimal places.
4. WHERE a Column_Profile has the Column_Type `categorical`, THE Profiler SHALL record at most the 10 most frequent non-null values with the occurrence count of each value, ordered by descending occurrence count with values of equal occurrence count ordered by ascending case-sensitive string comparison, and SHALL record all distinct non-null values when the distinct value count is less than 10.
5. WHERE a Column_Profile has the Column_Type `datetime`, THE Profiler SHALL record the earliest parsed date and the latest parsed date across the non-null values of that column which parse as dates in the Accepted_Date_Formats, and SHALL record the count of non-null values that failed to parse as a date.
6. THE Profiler SHALL record in the Data_Profile the count of retained data rows whose field values are all identical, compared as exact case-sensitive strings in header order, to those of an earlier retained data row.
7. THE Profiler SHALL compute a Correlation_Pair for each unordered pair drawn from the first 30 `numeric` columns in header order that have at least 3 retained rows where both values are non-null and parse as finite numbers, SHALL round each recorded coefficient to 6 decimal places, and SHALL record those Correlation_Pair values ordered by descending absolute coefficient with pairs of equal absolute coefficient ordered by ascending first column name and then ascending second column name.
8. IF a numeric column has a standard deviation of 0, THEN THE Profiler SHALL omit that column from every Correlation_Pair.
9. FOR ALL Column_Profile records, the sum of the null count and the non-null count SHALL equal the retained row count of the Data_Profile.
10. FOR ALL numeric Column_Profile records with a non-null count of at least 1, the recorded minimum SHALL be less than or equal to the recorded first quartile, the recorded first quartile SHALL be less than or equal to the recorded median, the recorded median SHALL be less than or equal to the recorded third quartile, and the recorded third quartile SHALL be less than or equal to the recorded maximum.
11. FOR ALL Correlation_Pair records, the recorded coefficient SHALL be greater than or equal to -1 and less than or equal to 1.
12. FOR ALL Parsed_Dataset values, profiling a Parsed_Dataset twice SHALL produce two Data_Profile values that are deeply equal.
13. IF a column has a non-null count of 0, THEN THE Profiler SHALL record the null count, the non-null count, and a distinct value count of 0 in that Column_Profile, SHALL omit every type-specific statistic named in criteria 3 through 5 from that Column_Profile, and SHALL mark those statistics as not computed.
14. IF the Profiler cannot complete profiling of a Parsed_Dataset, THEN THE Profiler SHALL produce no Data_Profile, THE Profiler_UI SHALL display a message indicating that the profile could not be computed and naming the column being processed, and THE Profiler_UI SHALL retain the previously displayed Data_Profile.
15. WHERE fewer than two `numeric` columns satisfy the conditions in criterion 7, THE Profiler SHALL record an empty Correlation_Pair list in the Data_Profile.

### Requirement 4: Profile-Driven Chart Recommendation

**User Story:** As a portfolio visitor, I want charts chosen for me based on the data, so that I see meaningful visualizations without configuring axes.

#### Acceptance Criteria

1. WHEN a Data_Profile is available, THE Chart_Recommender SHALL derive a list of at most 12 Chart_Spec records from that Data_Profile without input from the visitor, ordered by chart type in the sequence line, scatter, histogram, bar, and within each type ordered by the left-to-right column position of the source column in the Data_Profile.
2. WHERE the Data_Profile contains at least one `numeric` column whose non-null count is at least 2 and whose distinct non-null value count is at least 2, THE Chart_Recommender SHALL emit one histogram Chart_Spec for each such `numeric` column, with a bin count equal to the lesser of 30 and the distinct non-null value count of that column.
3. WHERE the Data_Profile contains at least one `categorical` column whose non-null count is at least 1, THE Chart_Recommender SHALL emit one bar Chart_Spec for each such `categorical` column containing the 10 most frequent non-null values of that column in descending frequency order, resolving equal frequencies by ascending lexicographic order of the value, and containing all non-null distinct values when that column has fewer than 10 distinct non-null values.
4. WHERE the Data_Profile contains at least one `datetime` column with at least 2 non-null values and at least one `numeric` column with at least 2 non-null values, THE Chart_Recommender SHALL emit exactly one line Chart_Spec plotting the leftmost qualifying `numeric` column against the leftmost qualifying `datetime` column, with points ordered by ascending datetime value.
5. WHERE the Data_Profile contains at least one Correlation_Pair with an absolute coefficient of at least 0.5, THE Chart_Recommender SHALL emit exactly one scatter Chart_Spec for the Correlation_Pair with the largest absolute coefficient, resolving equal absolute coefficients by selecting the pair whose leftmost column has the lowest column position in the Data_Profile.
6. WHEN the Chart_Recommender supplies one or more Chart_Spec records, THE Profiler_UI SHALL render every supplied Chart_Spec in the supplied order within 3 seconds of receiving the records.
7. WHEN the Profiler_UI renders a Chart_Spec, THE Profiler_UI SHALL display alongside that chart a recommendation reason of 1 to 200 characters that names the chart type, the source column names, and the Column_Type of each source column.
8. IF the Chart_Recommender emits zero Chart_Spec records, THEN THE Profiler_UI SHALL display a message indicating that the dataset contains no chartable columns and SHALL display the name and Column_Type of every column in the Data_Profile.
9. WHEN the Profiler_UI renders a chart, THE Profiler_UI SHALL provide a programmatically associated text alternative for that chart stating the chart type, the source column names, and the plotted values, listing at most 30 plotted values and stating the total plotted value count when more than 30 values are plotted.
10. THE Chart_Recommender SHALL emit each histogram Chart_Spec such that the sum of its bin counts equals the non-null count of its source column.
11. IF no Data_Profile is available or the Data_Profile is missing a Column_Type for every column, THEN THE Chart_Recommender SHALL emit zero Chart_Spec records and THE Profiler_UI SHALL display an error message indicating that recommendations cannot be produced and SHALL retain any previously rendered charts unchanged.
12. IF rendering a Chart_Spec fails, THEN THE Profiler_UI SHALL display in place of that chart an error message indicating which chart failed and SHALL render all remaining Chart_Spec records in the supplied order.

### Requirement 5: Data Quality Scoring

**User Story:** As a portfolio visitor, I want a quality score with concrete cleaning steps, so that I know what to fix before analyzing the dataset further.

#### Acceptance Criteria

1. WHEN a Data_Profile is available, THE Quality_Scorer SHALL compute a Quality_Score from the null counts, the duplicate row count, the Outlier counts, and the count of `unknown` Column_Type assignments, and SHALL complete the computation within 2 seconds.
2. THE Quality_Scorer SHALL record, for each of the four factors named in criterion 1, an integer penalty contribution between 0 and 100 inclusive, and the sum of the four penalty contributions SHALL equal 100 minus the Quality_Score.
3. THE Quality_Scorer SHALL emit a Cleaning_Recommendation for each column whose null count is greater than 0, naming that column, the null count, the null percentage of total rows rounded to 1 decimal place, and a null-handling action.
4. WHERE the duplicate row count is greater than 0, THE Quality_Scorer SHALL emit a Cleaning_Recommendation naming the duplicate row count and a deduplication action.
5. WHERE a `numeric` column has an Outlier count greater than 0, THE Quality_Scorer SHALL emit a Cleaning_Recommendation naming that column, the Outlier count, and the interquartile range bounds used to identify the Outlier values.
6. WHERE a column has the Column_Type `unknown`, THE Quality_Scorer SHALL emit a Cleaning_Recommendation naming that column and a manual review action.
7. WHEN the Quality_Scorer completes computation, THE Profiler_UI SHALL display, within 1 second, the Quality_Score, the four per-factor penalty contributions, and every Cleaning_Recommendation, ordered by descending penalty contribution of the factor that produced it.
8. FOR ALL Data_Profile values, the computed Quality_Score SHALL be an integer greater than or equal to 0 and less than or equal to 100.
9. WHERE a Data_Profile has a null count of 0 in every column, a duplicate row count of 0, an Outlier count of 0 in every `numeric` column, and zero `unknown` Column_Type assignments, THE Quality_Scorer SHALL compute a Quality_Score of 100.
10. IF no Data_Profile is available, THEN THE Quality_Scorer SHALL compute no Quality_Score and THE Profiler_UI SHALL display a message indicating that profiling must complete before scoring.
11. IF the Quality_Scorer emits zero Cleaning_Recommendation records, THEN THE Profiler_UI SHALL display an indicator that no cleaning actions are required.
12. IF the count of Cleaning_Recommendation records exceeds 100, THEN THE Profiler_UI SHALL display the first 100 records in the order defined by criterion 7 and the count of records not displayed.

### Requirement 6: AI Insight Narrative From Derived Data Only

**User Story:** As a portfolio visitor, I want a written interpretation of the profile, so that I understand what the statistics mean without reading every number.

#### Acceptance Criteria

1. WHEN a visitor activates the insight control AND a complete Data_Profile is present in the Profiler_UI, THE Profiler_UI SHALL construct an Insight_Payload from that Data_Profile and SHALL send the Insight_Payload to the Insight_Service.
2. THE Insight_Payload SHALL contain only the following fields and no others: the column names, limited to 200 columns with each name truncated to 128 characters, the Column_Type assignment per column, the aggregated statistics recorded in the Data_Profile, at most 50 Correlation_Pair records, the Quality_Score, and at most 50 Cleaning_Recommendation records.
3. THE Insight_Payload SHALL exclude every data row value, with the exception of the aggregated minimum, maximum, and most-frequent-value statistics already recorded in the Data_Profile, where each such value is truncated to 64 characters.
4. THE Profiler_UI SHALL expose zero free-text input fields on the insight control, and THE Insight_Payload SHALL contain zero fields whose value originates from visitor keyboard or clipboard input.
5. THE Insight_Service SHALL validate every received request body against a fixed Insight_Payload schema and SHALL treat as invalid any body that contains a field absent from that schema, omits a required field, or exceeds the field counts and lengths stated in criteria 2 and 3.
6. IF the Insight_Payload fails schema validation, THEN THE Insight_Service SHALL respond with HTTP status 400 and a message naming the first failing field, and SHALL issue no model request for that call.
7. THE Insight_Service SHALL construct the model request from exactly two inputs, a server-defined instruction stored on the server and the validated Insight_Payload, and SHALL include no other client-supplied content in that request.
8. THE Insight_Service SHALL request a structured Insight_Narrative containing a summary of at most 1,200 characters, between 3 and 7 observations of at most 300 characters each, and between 2 and 5 suggested next analyses of at most 200 characters each, and SHALL validate the model result against the Insight_Narrative schema before responding.
9. IF the model result fails Insight_Narrative schema validation, THEN THE Insight_Service SHALL respond with HTTP status 502 and a message stating that the narrative could not be generated, and SHALL return no partial narrative content.
10. THE Insight_Service SHALL limit each client to 10 accepted requests per rolling 60-minute window and SHALL respond with HTTP status 429 and a message indicating the request limit and the time remaining until the next request is permitted when a client exceeds that limit.
11. IF the Insight_Service responds with a status other than 200, THEN THE Profiler_UI SHALL display the returned message, SHALL retain the displayed Data_Profile, the rendered charts, and the Quality_Score unchanged, and SHALL retain the parsed rows in browser memory without transmitting them.
12. WHILE an Insight_Service request is in flight, THE Profiler_UI SHALL display a pending state on the insight control and SHALL ignore all further activations of that control until a response is displayed or the request is aborted.
13. IF the Insight_Service returns no response within 30 seconds of the request being sent, THEN THE Profiler_UI SHALL abort the request, SHALL display a message indicating that the insight request timed out, and SHALL return the insight control to its activatable state.
14. WHEN the Insight_Service responds with HTTP status 200 and a schema-valid Insight_Narrative, THE Profiler_UI SHALL render the summary, the observations, and the suggested next analyses, and SHALL return the insight control to its activatable state.
15. THE Profiler_UI SHALL display, adjacent to the insight control and to any rendered Insight_Narrative, a statement that the narrative is generated from aggregated statistics and that raw rows remain in the browser.

### Requirement 7: Report Export

**User Story:** As a portfolio visitor, I want to export the profile as a report, so that I can keep or share the analysis outside the browser.

#### Acceptance Criteria

1. WHILE a Data_Profile is available, WHEN a visitor activates the Markdown export control, THE Report_Exporter SHALL serialize the Data_Profile and the available Insight_Narrative into a single Markdown document and THE Profiler_UI SHALL start a browser download of that document with a file name containing the source dataset name and the export timestamp and the extension `.md`.
2. WHILE a Data_Profile is available, WHEN a visitor activates the JSON export control, THE Report_Exporter SHALL serialize the Data_Profile and the available Insight_Narrative into a single JSON document and THE Profiler_UI SHALL start a browser download of that document with a file name containing the source dataset name and the export timestamp and the extension `.json`.
3. THE Report_Exporter SHALL include the source dataset name, the retained row count, the total row count, the duplicate row count, the Quality_Score, every Column_Profile, every Correlation_Pair, every Cleaning_Recommendation, and the export timestamp expressed as an ISO 8601 timestamp in UTC in both document formats.
4. IF no Insight_Narrative is available at the time of export, THEN THE Report_Exporter SHALL produce the document with every other section populated as stated in criterion 3 and with the narrative section marked as not generated.
5. THE Report_Exporter SHALL execute in the browser and SHALL transmit zero bytes of the exported document to any server endpoint.
6. FOR ALL Data_Profile values, deserializing the JSON document produced by the Report_Exporter SHALL produce a Data_Profile deeply equal to the input Data_Profile.
7. WHILE no Data_Profile is available, THE Profiler_UI SHALL render the Markdown export control and the JSON export control in a disabled state that rejects activation by pointer and by keyboard.
8. IF serialization or the browser download of an export document fails, THEN THE Profiler_UI SHALL display an error message naming the requested document format and stating that no file was saved, SHALL retain the displayed Data_Profile, the rendered charts, the Quality_Score, and the Insight_Narrative, and SHALL return the activated export control to its enabled state.
9. WHEN a visitor activates an export control for a Data_Profile derived from at most the Row_Cap rows and at most 200 columns, THE Report_Exporter SHALL complete serialization within 5 seconds and THE Profiler_UI SHALL display a pending state on that control until the download starts or the error message in criterion 8 is displayed.

### Requirement 8: Reset and Session Boundaries

**User Story:** As a portfolio visitor, I want to clear the loaded dataset, so that I can profile another file and know the previous data is gone.

#### Acceptance Criteria

1. WHILE a Parsed_Dataset is loaded, THE Profiler_UI SHALL present a reset control that is operable by pointer and by keyboard.
2. WHILE no Parsed_Dataset is loaded, THE Profiler_UI SHALL either omit the reset control or present it in a disabled state that performs no action when activated.
3. WHEN a visitor activates the reset control, THE Profiler_UI SHALL discard the Parsed_Dataset, the Data_Profile, the Chart_Spec records, the Quality_Score, the Cleaning_Recommendation records, the parse issue list, and the Insight_Narrative, and SHALL display the intake state described in Requirement 1 within 1 second, with zero Column_Profile records, zero rendered charts, and no Quality_Score displayed.
4. WHEN a visitor loads a second dataset without activating the reset control, THE Profiler_UI SHALL discard the previous Parsed_Dataset, Data_Profile, Chart_Spec records, Quality_Score, Cleaning_Recommendation records, parse issue list, and Insight_Narrative before displaying any result derived from the second dataset, and SHALL at no point display a Column_Profile from the first dataset together with a Column_Profile from the second dataset.
5. THE Profiler_UI SHALL hold the Parsed_Dataset in page memory only and SHALL write zero data row values to browser persistent storage.
6. WHEN the visitor reloads the `/playground/data-profiler` route after any dataset has been loaded, THE Profiler_UI SHALL display the intake state described in Requirement 1 with no Parsed_Dataset, no Data_Profile, and no Insight_Narrative restored.
7. IF a visitor activates the reset control while an Insight_Service request is in flight or while the CSV_Parser is reading a file, THEN THE Profiler_UI SHALL complete the discard defined in criterion 3, SHALL ignore any result returned by that in-flight request or read, and SHALL display no Insight_Narrative and no Data_Profile derived from the discarded dataset.

### Requirement 9: Portfolio Presentation

**User Story:** As a portfolio visitor, I want to understand the engineering behind the profiler, so that the page demonstrates skill rather than only producing output.

#### Acceptance Criteria

1. WHEN a visitor navigates to the route `/playground/data-profiler`, THE Profiler_UI SHALL render its initial view within 3 seconds measured from navigation start on a broadband connection.
2. THE Profiler_UI SHALL render using the existing Tailwind design tokens and the shared components under `components/docs/common`, with no component styling that overrides those tokens with literal color, spacing, or font values.
3. THE Profiler_UI SHALL display an explanation section that is visible without profiling a dataset and that states, in text, the numeric threshold values used to assign each Column_Type, the numeric rule used to classify a value as an Outlier, each factor contributing to the Quality_Score together with its weight, and a statement that the Insight_Payload contains derived data only and no raw cell values.
4. THE Profiler_UI SHALL make the file selection control, the Sample_Dataset selection control, the insight control, the export controls, and the reset control reachable in visual order using the Tab and Shift+Tab keys, activatable using the Enter key and, for button and checkbox controls, the Space key, and SHALL render a focus indicator on the control that currently holds keyboard focus.
5. WHILE the viewport width is between 320 and 767 pixels inclusive, THE Profiler_UI SHALL render all content in a single column with no horizontal scrolling, no clipped or overlapping text, and interactive controls at a minimum target size of 44 by 44 pixels.
6. WHILE the visitor's operating system requests a reduced-motion preference, THE Profiler_UI SHALL render charts and transitions in their final state with no animation and no transition duration greater than 0 milliseconds.
7. WHILE no dataset has been profiled in the current session, THE Profiler_UI SHALL display the explanation section, the file selection control, and the Sample_Dataset selection control in an enabled state, and SHALL display the insight control and the export controls in a disabled state with a message indicating that a dataset must be profiled first.
8. IF the visitor activates the reset control, THEN THE Profiler_UI SHALL return to the state defined in criterion 7 and SHALL discard the previously displayed profiling results, Quality_Score, and Insight_Payload from the view.
