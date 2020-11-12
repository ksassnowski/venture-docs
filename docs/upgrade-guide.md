# Upgrade Guide

[[toc]]

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
