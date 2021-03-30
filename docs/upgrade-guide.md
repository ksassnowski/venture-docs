# Upgrade Guide

[[toc]]

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
