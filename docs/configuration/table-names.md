# Changing the table names

Venture creates two tables to keep track of workflows and their related jobs. By default, these tables are called `workflows` and `workflow_jobs`. You can customize this with the `venture.workflow_table` and `venture.jobs_table` configuration values, respectively.

**config/venture.php**

```php
<?php

return [
    'workflow_table' => 'workflows',
    'jobs_table' => 'workflow_jobs',
];
```

:::danger Important
If you want to customize the table names, you need to do so **before** running the migrations. Changing them afterwards will not only not have an effect, it will actually lead to an error because the Eloquent models will try and look for a table that doesn't exist.
:::
