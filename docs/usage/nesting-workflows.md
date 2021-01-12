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

```php
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\Facades\Workflow;
use Sassnowski\Venture\WorkflowDefinition;

class PodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Podcast Workflow')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addWorkflow(new EncodePodcastWorkflow($this->podcast), [
                ProcessPodcast::class,
            ]);
    }
}
```

This brings up an interesting question. What exactly does it mean for a _workflow_ to depend on a job? This is easier to visualize than to describe in words, so here's what the resulting workflow will look like:

<div style="text-align: center;">
    <img src="/connect-workflow-with-job.svg" />
</div>

Starting a workflow means starting all jobs that can be run in parallel. This is why Venture connected all root nodes of the nested workflow with the job.

:::warning Note
The `EncodePodcastWorkflow` box in the diagram is only there for the sake of demonstration. The outer workflow won't have any reference to a nested workflow. It's as if you would have added all of the nested workflow's jobs individually.
:::

## Depending on a nested workflow

### Workflows depending on other workflows

Finally, you can also have a nested workflow depend on another nested workflow.

```php
<?php

namespace App\Workflows;

use Sassnowski\Venture\AbstractWorkflow;
use Sassnowski\Venture\Facades\Workflow;
use Sassnowski\Venture\WorkflowDefinition;

class PodcastWorkflow extends AbstractWorkflow
{
    public function definition(): WorkflowDefinition
    {
        return Workflow::define('Podcast Workflow')
            ->addJob(new ProcessPodcast($this->podcast))
            ->addWorkflow(new EncodePodcastWorkflow($this->podcast), [
                ProcessPodcast::class,
            ])
            ->addWorkflow(new PublishPodcastWorkflow($this->podcast), [
                EncodePodcastWorkflow::class,
            ]);
    }
}
```

This would result in the following workflow.

<div style="text-align: center;">
    <img src="/workflow-depends-on-workflow.svg" />
</div>

Ok, there's a lot going on here.
