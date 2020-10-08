# Installation and Setup

::: warning NOTE
This package requires PHP **7.4** and Laravel **8.x**
:::

You can install this package through composer

```bash
composer require sassnowski/laravel-workflow
```

## Publishing the configuration

Next, we need to publish the configuration that comes with this package. You can do so by running the following artisan command:

```bash
php artisan vendor:publish --vendor="Sassnowski\LaravelWorkflow"
```

This will create a `workflow.php` file in your application's `config` directory.

## Running the migrations

This package creates two new tables. By default they are named `workflows` and `workflow_jobs`. Both of these values can be overwritten inside the configuration file.

To execute the migrations, run

```bash
php artisan migrate
```

## Registering the event subscriber

Laravel Workflow comes with an event subscriber that listens for finished jobs and checks if they are part of a workflow. If so, it will notify the corresponding workflow that one of its jobs has finished.

To register the event subscriber, add them to the `$subscribe` array inside your application's `EventServiceProvider`.

```php{10}
<?php

namespace App\Providers;

use Sassnowski\LaravelWorkflow\WorkflowEventSubscriber;

class EventServiceSubscriber extends ServiceProvider
{
    protected $subscribe = [
        WorkflowEventSubscriber::class,
    ];
}
```

That's all the setup necessary. Next, let's look at how we can get our jobs to work inside a workflow.
