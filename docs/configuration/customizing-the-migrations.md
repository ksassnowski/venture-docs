# Customizing the migrations

::: tip Tip
If all you want to do is change the table names of Venture's tables, check out [Changing the table names](/configuration/table-names) in the _Configuration_ section.
:::

In case you want to alter the migrations that come with Venture, you can publish them with the following `artisan` command.

```bash
php artisan vendor:publish --provider="Sassnowski\Venture\VentureServiceProvider" --tag=migrations
```

This will place three migrations into your applications `database/migrations` folder: `2020_08_16_000000_create_workflow_table.php`, `2020_08_17_000000_add_additional_columns_to_workflow.php` and `2020_11_13_000000_add_edges_column_and_exception_column_to_workflow_jobs_table`.

:::danger Warning
You should never change the default columns that come with Venture since that might cause the package to stop working properly.
:::
