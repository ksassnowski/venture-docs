# Caveats and limitations

Venture is still in early development and as such has a few limitations and things you should be aware of before using it in production.

## Circular Dependencies

The package currently does not check for circular dependencies in your workflow.

## Duplicate Jobs

It is currently not supported to have multiple instances of the same job inside a workflow. So something like this is not possible

```php
Workflow::withInitialJobs([...])
    ->addJob(new Job1, [])
    ->addJob(new Job2, [])
    // Not possible, because an instance of `Job1` was
    // already used inside this workflow.
    ->addJob(new Job1, [])
```

The package won't complain, but the behaviour will be undefined.
