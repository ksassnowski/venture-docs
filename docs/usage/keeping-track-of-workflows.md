# Keeping track of workflows

All workflows and their individual steps get stored inside the database. When you start a workflow, an instance of the workflow will be returned.

```php
$workflow = Workflow::new('Publish Podcast')
    ->addJob(new ProcessPodcast($podcast))
    // ...
    ->start();
```
