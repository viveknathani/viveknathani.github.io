«««
title: database admin
»»»

# database admin

Handy notes/scripts/commands for doing database work.

### working with RDS backups on your local machine (exported to S3, stored in parquet format)

```python
import pandas as pd
import os

parent_directory = 'your_downloaded_directory'

def list_directories(directory):
    directories = []
    for item in os.listdir(directory):
        if os.path.isdir(os.path.join(directory, item)):
            directories.append(item)
    return directories

def list_files(directory):
    files = []
    for item in os.listdir(directory):
        if os.path.isdir(os.path.join(directory, item)) == False:
            files.append(item)
    return files

directories = list_directories(parent_directory)

for directory in directories:
    parts = directory.split('.')
    schema_name = parts[0]
    table_name = parts[1]
    for sub_directory in list_directories(parent_directory + '/' + directory):
        for file in list_files(parent_directory + '/' + directory + '/' + sub_directory):
            if file.startswith('part'):
                df = pd.read_parquet(parent_directory + '/' + directory + '/' + sub_directory + '/' + file)
                print("==============================================")
                print("table name = ", table_name)
                print("columns = ", list(df.columns))
                print("==============================================")
                print("\n\n")
```

### backup or restore in postgres

```bash
PGPASSWORD=your_password pg_dump -h localhost -U your_username -p 12345 your_database_name -t users > users.sql
pg_restore -d your_database_name users.sql
```

### JSON array to SQL inserts in Node.js

```javascript
import pg from 'pg';
import { config } from 'dotenv';
config();

const { Client } = pg;
const client = new Client({
  database: process.env.DB_DATABASE,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
});

(async () => {
  const data = []; // LOAD YOUR JSON ARRAY HERE
  await client.connect();
  for (const datum of data) {
      await client.query(`YOUR INSERT STATEMENT GOES HERE`);
  }
  await client.end();
})();
```
