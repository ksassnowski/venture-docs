# Installation

[[toc]]

## Installation

### Requirements

Venture requires PHP **7.4** and Laravel **8.x**

### Insatlling Venture

You can install Venture through composer

```bash
composer require sassnowski/venture
```

## Preparing the application

After installing Venture, there are a few things we need to do to prepare our application.

### Publishing the configuration

First, we need to publish the configuration that comes with Venture. You can do so by running the following artisan command:

```bash
php artisan vendor:publish --vendor="Sassnowski\Venture"
```

This will create a `venture.php` file in your application's `config` directory.

### Running the migrations

Venture creates two new tables. By default they are named `workflows` and `workflow_jobs`. Both of these values can be overwritten inside the configuration file (see the [configuration page](/configuration/table-names) for more information).

To execute the migrations, run

```bash
php artisan migrate
```

### Registering the event subscriber

Venture comes with an event subscriber that listens for finished jobs and checks if they are part of a workflow. If so, it will notify the corresponding workflow that one of its jobs has finished.

To register the event subscriber, add them to the `$subscribe` array inside your application's `EventServiceProvider`.

```php{10}
<?php

namespace App\Providers;

use Sassnowski\Venture\WorkflowEventSubscriber;

class EventServiceSubscriber extends ServiceProvider
{
    protected $subscribe = [
        WorkflowEventSubscriber::class,
    ];
}
```

That's all the setup necessary. Next, let's look at how we can get our jobs to work inside a workflow.
