# Nesting Workflows

[[toc]]

## Overview

As your application grows, you might want to extract a subset of jobs into a separate workflow so that you can re-use them inside other workflows. Just like you can add individual jobs, you can embed an entire other workflow inside your workflow.

## Adding a nested workflow

To add a workflow to another workflow, you can use the `addWorkflow` method on the definition instance.

```php{14}
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\Facades\Workflow;
use Sassnowski\Venture\WorkflowDefinition;

class PublishPodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Publish Podcast')
            ->addWorkflow(new OptimizePodcastWorkflow($this->podcast));
    }
}
```

### Adding a nested workflow with dependencies

Just like regular jobs inside a workflow, nested workflows can also depend on other jobs to finish first.

## Depending on a nested workflow

### Workflows depending on other workflows
