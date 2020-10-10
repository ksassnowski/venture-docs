# Preparing your Jobs

[[toc]]

## Overview

All we need to do to enable our jobs to be run inside a workflow is to make them use the `WorkflowStep` trait that comes with Venture.

```php{5,9}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowStep;

class MyJob
{
    use WorkflowStep;
}
```

Doing so will enable the package to keep track of both the dependencies of a job as well as the job that are dependant on it. It also allows us keep track of the state of each step inside a workflow.

::: tip Tip
If you get an error about calling an undefined method `withWorkflowId` on a job, you probably forgot to add the trait to your job.
:::

That's it. Your job is now able to be used inside a workflow. Let's look at how to configure a workflow next.
