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
PGPASSWORD=your_password pg_dump -h localhost -U your_username -p 12345 your_database_name -F t users > users.tar
pg_restore -d your_database_name users.tar
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

### connection pooling (postgres)

- we can often support more concurrent users by reducing the number of database connections and using some form of connection pooling
- generally, throughput improves as you increase connections
- but, after a point, the connections will start to fight for resources - this causes decrease in throughput
- instead, after a threshold of connections, it is better to queue a transaction
- connection pooling is not an internal feature of postgres, has to be implemented externally (ref:https://wiki.postgresql.org/wiki/Number_Of_Database_Connections)
- reasons for falling performance after a threshold
    - disk contention
    - RAM usage
    - lock contention
    - context switching
    - cache line contention
    - general scaling
- optimal connection pool size: ((core_count * 2) + effective_spindle_count) [OUTDATED in context of SSDs]
	- "sweet spot" is for the number of connections that are actively doing work
	- always make max_connections a bit bigger than the number of connections you enable in your connection pool to have room for system maintenance and monitoring

### enums

- enum vs constant at application level
    - enums are better for type safety, you could go wrong with const representations
    - enums exist in TS but not in JS. during compilation to JS, an extra object is created to represent that enum. 
    - a “const enum” in TS prevents this object creation and are quite literally just transpiled down to numbers, however this could lead to runtime bugs.
    - unless you are writing a low level library, it is most likely okay to use TS enums for application level stuff.
- enums in postgres
    - create type your_type as enum (‘value1’, ‘value2’);
    - ordering of the values in an enum type is the order in which the values were listed when the type was created. this lets you do greater than, less than comparisons in your queries, coz under the hood, it is just numbers
    - enums are type safe:  ‘value1’ of ‘enum1’ is different from ‘value1’ of ‘enum2’
    - enum labels are case sensitive
    - storage: enum value takes 4 bytes on disk, enum label value takes 63 bytes at most
    - you can add more values to an enum by doing `alter type`. can also decide the exact order
    - it is not possible to delete an existing enum value
    - under the hood, the enum data is stored in pg_enum table
    - enums are however not a SQL standard.
- enum type vs separate table
    - well atleast for postgres, it is fundamentally the same thing. with proper indexing for joins, a separate table is a better option, since the maintainence is easier. for the engineer, it is one line extra for writing the join.
- or just do application level enum management and store raw strings/ints in DB?
    - someone with direct access to DB can add any arbitrary value because it is just a string/init in the DB. 
    - reduces one join, so might be a tad bit faster, but any frequently joined table would be cached by a good DB.
- conclusion: use separate tables. sweet spot for performance and maintenance.
