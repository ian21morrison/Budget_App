# Retirement Projection Inputs

## Status

Accepted

## Context

Retirement projections need to handle accounts with different return assumptions. A high-yield
savings account can be a cash account and still receive monthly contributions, but it should not
be projected at the same return as a Roth IRA or brokerage account.

## Decision

Expected return is an account-level assumption edited in the Accounts section. Monthly
contributions choose which accounts receive new monthly money. The retirement projection compounds
each contribution account separately using that account's balance, monthly contribution, and
expected return.

## Consequences

- Cash accounts can remain cash while participating in projections.
- The projection can show a weighted return and return mix.
- Account return assumptions have one editing location.
