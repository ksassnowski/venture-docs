# Caveats and limitations

There are a few limitations you should be aware of when designing your workflows.

## Circular Dependencies

The package currently does not check for circular dependencies in your workflow.

## Duplicate Jobs

Because of how Venture keeps track of dependencies, it is currently not supported to have multiple instances of the same job inside a workflow. So something like this is not possible

```php
Workflow::define('Example workflow')
    ->addJob(new Job1, [])
    ->addJob(new Job2, [])
    // Not possible, because an instance of `Job1` was
    // already used inside this workflow.
    ->addJob(new Job1, [])
```

The package won't complain, but the behaviour will be undefined.
