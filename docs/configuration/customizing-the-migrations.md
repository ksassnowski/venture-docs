# Customizing the migrations

::: tip Tip
If all you want to do is change the table names of Venture's tables, check out [Changing the table names](/configuration/table-names) in the _Configuration_ section.
:::

In case you want to alter the migrations that come with Venture, you can publish them with the following `artisan` command.

```bash
php artisan vendor:publish --provider="Sassnowski\Venture\VentureServiceProvider" --tag=migrations
```

This will place two migrations into your applications `database/migrations` folder: `2020_08_16_000000_create_workflow_table.php` and `2020_08_17_000000_add_additional_columns_to_workflow.php`.

:::danger Warning
You should never change the default columns that come with Venture since that might cause the package to stop working properly.
:::
