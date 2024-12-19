![mongo2postgres](https://github.com/Rabithua/mongo2postgres/blob/main/mongo2postgres.png)

# MongoDB to PostgreSQL CSV Converter

A tool for converting MongoDB CSV files to PostgreSQL format.

## Features

- Converts MongoDB `_id` field to UUID format
- Renames the field `_id` to `id`
- Flattens arrays and objects
- Converts complex arrays and objects to JSON strings
- Generates CSV files that meet PostgreSQL format requirements

## Usage

1. Prepare the MongoDB CSV file you want to convert
2. Run the conversion script
3. Obtain the converted PostgreSQL format CSV file

## Example Code

```javascript
const arr = ["Attachment", "Rote", "User", "UserOpenKey", "UserSwSubScription"];

for (let i = 0; i < arr.length; i++) {
  const results = [];
  const inputFilePath = `./mongo/Rote.${arr[i]}.csv`;
  const outputFilePath = `./mongo/Rote.${arr[i]}.Modified.csv`;

  fs.createReadStream(inputFilePath)
    .pipe(csv())
    .on("data", (data) => {
      processData(data);
      console.log(data);
      results.push(data);
    })
    .on("end", () => {
      // Convert results to CSV and write to file
      const csvData = parse(results);
      fs.writeFileSync(outputFilePath, csvData);
      console.log("CSV file has been successfully modified and saved.");
    });
}
```

## License

MIT
