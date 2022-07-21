# Upgrade Guide

## Migrating to 4.0 from 3.x

### Laravel Version

**Likelihood of Impact: High**

Starting with version 4.0, Venture requires Laravel 9.

### Migrating the database

**Likelihood of Impact: Very High**

::: warning Migration don’t run automatically anymore
Venture 4 no longer registers its migrations to run automatically. This means that from now on, you will need to create the migration to add any new columns yourself. The exact columns to add will always be listed in the upgrade guide and no database changes will happen in minor releases.
:::

Venture 4 added three new columns to the `workflow_jobs` table:

- `gated_at`
- `gated`
- `started_at`

There are also two new columns that were added to the `workflows` table in order to allow workflows to be associated with models:

- `workflowable_type`
- `workflowable_id`

::: tip Associating workflows with models
Check out the [Entity Aware Workflows plugin](/plugins/entity-aware-workflows) to learn how to associate workflows with models.
:::

To add these columns, create a new migration and add the following contents:

```php
<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

return new class() extends Migration {
    public function up()
    {
        Schema::table(config('venture.workflow_table'), function (Blueprint $table) {
        	$table->nullableMorphs('workflowable'); 
        });
        
        Schema::table(config('venture.jobs_table'), function (Blueprint $table) {
            $table->timestamp('gated_at')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->boolean('gated')->default(false);
        });
    }
};
```

After this, run the migration with the `artisan migrate` command.

### Removed `opis/closure` dependency

**Likelihood of Impact: Low to Medium**

Starting with version [3.6.5](https://github.com/ksassnowski/venture/releases/tag/3.6.5), Venture uses the `laravel/serializable-closure` package to serialize the `then` and `catch` callbacks of a workflow. Before that, the `opis/closure` package was used. To keep compatibility with older workflows, the `opis/closure` dependency was kept around even though new workflows didn’t use it anymore.

Version 4 of Venture removed the `opis/closure` dependency. If you’ve been using at least version `3.6.5` of Venture for a while, this change shouldn’t affect you since all workflows that were using `opis/closure` should have already been run.

If you still need backwards compatibility for older workflows, you should add `opis/closure` to your `composer.json` manually.

### Jobs should implement `WorkflowStepInterface`

**Likelihood of Impact: Optional (but highly recommended)**

Up until now, workflow jobs only had to use the `WorkflowStep` trait in order to use them as part of a workflow. Venture 4 introduces a `WorkflowStepInterface` that all jobs need to implement.

In Venture 4, jobs that don’t implement the interface yet will get wrapped in an adapter class internally. Adding these jobs to a workflow will trigger a deprecation warning. Starting with Venture 5, support for jobs that don’t implement the `WorkflowStepInterface` will be dropped.

The `WorkflowStep` trait automatically implements the `WorkflowStepInterface`. This means all you will have to do is add the interface to your job’s class declaration.

```diff
use Sassnowski\Venture\WorkflowStep;
+ use Sassnowski\Venture\WorkflowStepInterface;

- class MyJob
+ class MyJob implements WorkflowStepInterface
{
	use WorkflowStep;
}
```

### `WorkflowDefinition` requires an `AbstractWorkflow` instance

**Likelihood of Impact: Very High**

The `WorkflowDefinition` constructor now expects an instance of `AbstractWorkflow` as its first parameter. Up until version 4, it only expected the workflow’s name.

This change will most likely affect all jobs as the `Workflow` facade’s `define` method was also updated accordingly. When calling the `define` method, you should now pass `$this` as the first parameter.

```diff
class PublishPodcastWorkflow implements AbstractWorkflow
{
	public function definition(): WorkflowDefinition
	{
-		return Workflow::define('Publish podcast');
+		return Workflow::define($this, 'Publish podcast');
	}
}
```

As a convenience, a new `define` method was added to the `AbstractWorkflow` class that automatically passes the current workflow instance to the `WorkflowDefinition`’s constructor. This means that in most cases, you should be able to perform a simple find/replace on your codebase to update your jobs.

```diff
class PublishPodcastWorkflow implements AbstractWorkflow
{
	public function definition(): WorkflowDefinition
	{
-		return Workflow::define('Publish podcast');
+		return $this->define('Publish podcast');
	}
}
```

## Migrating to 3.0 from 2.x

### PHP Version

**Likelihood of Impact: High**

The new minimum PHP version is 8.0.

### Removed `addJobWithDelay` method

**Likelihood of Impact: Medium**

The `addJobWithDelay` method has been removed from the `WorkflowDefinition` class. This method was meant as an alternative version to the `addJob` method with a different order of parameters. Since PHP 8 introduced named parameters, this method has become obsolete.

Instead of doing something like this

```php
Workflow::define('Workflow name')
    ->addJobWithDelay(new Job(), now()->addMinute());
```

we can now use this instead and get the same effect.

```php
Workflow::define('Workflow name')
    ->addJob(new Job(), delay: now()->addMinute());
```

### Testing if workflow contains nested job

**Likelihood of Impact: Medium**

Venture provides an option to add a workflow to another workflow using the `addWorkflow` method on the `WorkflowDefinition` (try saying that fast three times). With Venture 3, jobs from a nested workflow now get prefixed internally with the name of the id of the workflow.

This means that if you have written tests that check if a workflow contains a job from a nested workflow, you now have to add the prefix to your assertion.

Here's an example. Assuming you have two workflows like this, where `InnerWorkflow` gets nested inside `OuterWorkflow`...

```php
class InnerWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Inner workflow')
            ->addJob(new NestedJob1());
    }
}

class OuterWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Outer workflow')
            ->addWorkflow(new InnerWorkflow());
    }
}
```

...and a test for `InnerWorklfow` that checks that it contains the `NestedJob1` job.

```php
$workflowDefinition = (new OuterWorkflow())->definition();

$this->assertTrue(
    $workflowDefinition->hasJob(NestedJob1::class)
);
```

This test would start failing in Venture 3 because the id of `NestedJob1` has been prefixed to `InnerWorkflow::class.NestedJob1::class`. We would have to update the test accordingly.

```php
$workflowDefinition = (new OuterWorkflow())->definition();

$this->assertTrue(
    $workflowDefinition->hasJob(InnerWorkflow::class . '.' . NestedJob1::class)
);
```

## Migrating to 2.0 from 1.x

### Migrations

**Likelihood of Impact: High**

A few more columns got added the `workflow_jobs`. As such you will have to run `php artisan migrate` again after upgrading.

### Workflows

#### Adding Jobs to Workflows

**Likelihood of Impact: Medium**

Previously, Venture allowed you to declare a dependency before that dependency had been added to the workflow. Doing so will now throw an `UnresolvableDependenciesException` instead. Make sure that before adding a job to a workflow all of its dependencies have been added already.

```php
Workflow::define('Workflow Name')
    // This will now throw an exception because `Job1`
    // has not been added to the workflow yet.
    ->addJob(new Job2(), [Job1::class])
    ->addJob(new Job1(), []);

Workflow::define('Workflow Name')
    ->addJob(new Job1(), [])
    // This works since `Job1` has already been added.
    ->addJob(new Job2(), [Job1::class]);
```

#### Cannot add jobs without the `ShouldQueue` interface

**Likelihood of Impact: Low**

Venture requires all jobs inside a workflow to implement the `ShouldQueue` interface.
Trying to add a job that doesn't implement this interface will now throw an `NonQueueableWorkflowStepException`.

Check out the [relevant section](/usage/preparing-your-jobs#dealing-with-synchronous-jobs) in the documentation to learn how you can dispatch
jobs synchrounously.

## Migrating to 1.0 from 0.x

### Workflows

In 0.x versions of Venture, workflows were defined in an ad-hoc fashion. This meant that the place you defined a workflow usually was also the place you started them. As a consequence, workflows were almost impossible to re-use and test.

Version 1 of Venture fundamentally changes how workflows are defined. Instead of defining and starting them inline, workflows are now defined in separate classes. Having a persistent workflow definition allows us to re-use them across our application. It also enables us to reason about them separately in our tests.

#### Defining Workflows

**Likelihood Of Impact: High**

Instead of defining your workflows inline, extract them to a dedicated workflow class as described in the [Configuring Workflows](/usage/configuring-workflows) section of the docs.

```php
use Sassnowski\Venture\Facades\Workflow;
use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\WorkflowDefinition;

class MyWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('My Workflow')
            ->addJob(new ExampleJob());
    }
}
```

Please note that instead of calling the `new` method on the Workflow model, you now need to call the `define` method on the `Workflow` facade.

#### Starting Workflows

**Likelihood of Impact: High**

Instead of chaining a `start` method directly onto your workflow builder, use the static `start` method of your workflow definition. See the [Starting a Workflow](/usage/configuring-workflows#starting-a-workflow) section of the docs.

```php
MyWorkflow::start();
```
