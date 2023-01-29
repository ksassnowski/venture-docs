# Installation

This section will help you get started with installing Venture into your project.

## Step 1: Installation

### Requirements

Venture requires PHP 8.1 or higher and Laravel 9 or higher.

### Installing Venture

You can install Venture through composer

```bash
$ composer require sassnowski/venture
```

## Step 2: Preparing the application

After installing Venture, there are a few things we need to do to prepare our application.

### Publishing the configuration

First, we need to publish the configuration that comes with Venture. You can do so by running the following artisan command:

```bash
php artisan vendor:publish --provider="Sassnowski\Venture\VentureServiceProvider" --tag=config
```

This will create a `venture.php` file in your application's `config` directory.

### Running the migrations

Venture creates two new tables. By default they are named `workflows` and `workflow_jobs`. Both of these values can be overwritten inside the configuration file (see the [configuration page](/configuration/table-names) for more information).

To execute the migrations, you first need to publish the migrations.

```bash
php artisan vendor:publish --provider="Sassnowski\Venture\VentureServiceProvider" --tag="migrations"
```

After that you can run the migrations.

```bash
php artisan migrate
```

That's all the setup necessary. Next, let's look at how we can get our jobs to work inside a workflow.
