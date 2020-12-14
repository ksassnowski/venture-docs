# Installation

[[toc]]

## Installation

### Requirements

Venture requires PHP 7.4 or 8 and Laravel 7 or 8.

### Installing Venture

You can install Venture through composer

```bash
composer require sassnowski/venture
```

## Preparing the application

After installing Venture, there are a few things we need to do to prepare our application.

### Publishing the configuration

First, we need to publish the configuration that comes with Venture. You can do so by running the following artisan command:

```bash
php artisan vendor:publish --provider="Sassnowski\Venture\VentureServiceProvider" --tag=config
```

This will create a `venture.php` file in your application's `config` directory.

### Running the migrations

Venture creates two new tables. By default they are named `workflows` and `workflow_jobs`. Both of these values can be overwritten inside the configuration file (see the [configuration page](/configuration/table-names) for more information).

To execute the migrations, run

```bash
php artisan migrate
```

That's all the setup necessary. Next, let's look at how we can get our jobs to work inside a workflow.

#### Customizing the migrations

If you want change the migrations that come with Venture, check out [Customizing the Migrations](/configuration/customizing-the-migrations) in the _Configuration_ sections.
