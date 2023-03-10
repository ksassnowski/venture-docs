# Preparing your Jobs

Any job you want to add to a workflow needs to implement `WorkflowableJob`.

```php{5,7}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowableJob;

class MyJob implements WorkflowableJob
{
}
```

This interface defines quite a few methods that Venture uses internally to
configure your jobs. If you are interested in the specifics, you can check out
the interface
[on GitHub](https://github.com/ksassnowski/venture/tree/master/src/WorkflowableJob.php).

Luckily, Venture also comes with a handy `WorkflowStep` trait which
automatically implements this interface for you.

```php{5,10}
<?php

namespace App\Jobs;

use Sassnowski\Venture\WorkflowStep;
use Sassnowski\Venture\WorkflowableJob;

class MyJob implements WorkflowableJob
{
    use WorkflowStep;
}
```

This trait automatically includes Laravel’s `Queueable` trait behind the scenes.
So if you’ve previously added the `Queuable` trait to your jobs manually, you
can safely remove it.

```diff
<?php

namespace App\Jobs;

- use Illuminate\Bus\Queueable;
use Sassnowski\Venture\WorkflowStep;
use Sassnowski\Venture\WorkflowableJob;

class MyJob implements WorkflowableJob
{
    use WorkflowStep;
-   use Queueable;
}
```

That's it. Your job is now able to be used inside a workflow. Venture will now
automatically keep track of this job’s dependencies as well as the jobs that
depend on it.

All the other configuration options that you are used to from Laravel’s jobs
still work the same, even if you use the job inside a workflow. You can also
still dispatch this job on its own without adding it to a workflow first.
