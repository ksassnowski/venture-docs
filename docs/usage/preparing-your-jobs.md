# Preparing your Jobs

[[toc]]

## Overview

Any job you want to add to a workflow needs to implement `WorkflowStepInterface`. 

```php{5,7}
<?php
    
namespace App\Jobs;

use Sassnowski\Venture\WorkflowStepInterface;

class MyJob implements WorkflowStepInterface
{
}
```

This interface defines quite a few methods that Venture uses internally to configure your jobs. If you are interested in the specifics, you can check out the interface [on GitHub](https://github.com/ksassnowski/venture/tree/master/src/WorkflowStepInterface.php).

Luckily for us, Venture also comes with a handy `WorkflowStep` trait which automatically implements this interface for you.

```php{5,10}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowStep;
use Sassnowski\Venture\WorkflowStepInterface;

class MyJob implements WorkflowStepInterface
{
    use WorkflowStep;
}
```

This trait automatically includes Laravel’s `Queueable` trait behind the scenes. So if you’ve previously added the `Queuable` trait to your jobs manually, you can safely remove it.

```diff
<?php

namespace App\Jobs;

- use Illuminate\Bus\Queueable;
use Sassnowski\Venture\WorkflowStep;
use Sassnowski\Venture\WorkflowStepInterface;

class MyJob implements WorkflowStepInterface
{
    use WorkflowStep;
-   use Queueable;
}
```

That's it. Your job is now able to be used inside a workflow. Venture will now automatically keep track of this job’s dependencies as well as the jobs that are dependent on it.

## Dealing with synchronous jobs

All jobs in a workflow will be dispatched via Laravel’s queue system. This is because the  `WorkflowStepInterface` extends Laravel’s `ShouldQueue` interface behind the scenes.

There might still be cases where you want a job to run synchronously, however. In these cases you should explicitly set the jobs `connection` to `sync`. You can do this in one of two ways.

You can either set the job’s `$connection` parameter to `sync` from within the job's constructor:

```php{13}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowStep;

class MyJob implements WorkflowStepInterface
{
    use WorkflowStep;

    public function __construct()
    {
        $this->connection = 'sync';
    }
}
```

Alternatively, you can call the `withConnection` method when creating the job instance.

```php{2}
$this->define('My workflow')
    ->addJob((new MyJob())->withConnection('sync'));
```

You can also set the connections for all jobs in a workflow at once by calling `allOnConnection` on the definition itself.

```php{2}
$this->define('My workflow')
    ->allOnConnection('sync')
    ->addJob(new MyJob());
```

Note that doing so will override whatever connection you have defined inside your job classes.
