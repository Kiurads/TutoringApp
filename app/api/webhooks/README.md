# `app/api/webhooks`

Container directory for inbound webhook receivers. Currently holds a single subdirectory, `stripe/`, which is where all real logic lives — see `stripe/README.md`. This top-level directory exists purely as the URL namespace (`/api/webhooks/stripe`); there's nothing to document at this level beyond "if the app ever needs a webhook from another provider, it goes in a sibling directory here."
