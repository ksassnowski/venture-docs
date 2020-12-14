# Preparing your Jobs

[[toc]]

## Overview

To enable our jobs to run inside a workflow, we only need do two things. First, make sure that your job is implementing the `ShouldQueue` interface that comes with Laravel. Check the [section below](#dealing-with-synchronous-jobs) to learn how to include synchronous jobs in your workflows.

Next, we need to use the `WorkflowStep` trait that comes with Venture.

```php{5,10}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowStep;
use Illuminate\Contracts\Queue\ShouldQueue;

class MyJob implements ShouldQueue
{
    use WorkflowStep;
}
```

Doing so will enable the package to keep track of both the dependencies of a job as well as the job that are dependant on it. It also allows us to keep track of the state of each step inside a workflow.

::: tip Tip
If you get an error about calling an undefined method `withWorkflowId` on a job, you probably forgot to add the trait to your job.
:::

That's it. Your job is now able to be used inside a workflow. Let's look at how to configure a workflow next.

## Dealing with synchronous jobs

Venture requries all jobs in a workflow to implement the `ShouldQueue` interface. This is because Venture relies on the events that are fired by Laravel's queue system.

There might still be cases where you want a job to run synchronously, however. In these cases you should explicitly set the jobs `connection` to `sync`. You can do this in two ways.

Either set the jobs `$connection` parameter to `sync` from within the job's constructor...

```php{15}
<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Sassnowski\Venture\WorkflowStep;
use Illuminate\Contracts\Queue\ShouldQueue;

class MyJob implements ShouldQueue
{
    use WorkflowStep, Queueable;

    public function __construct()
    {
        $this->connection = 'sync';
    }
}
```

... or by calling the `onConnection` method when creating the job instance.

```php{2}
Workflow::define('My workflow')
    ->addJob((new MyJob())->onConnection('sync'));
```

::: warning Note
Be aware that for this to work your job needs to use the `Illuminate\Bus\Queueable` trait.
:::
