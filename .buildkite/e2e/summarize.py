#!/usr/bin/env python3
"""Unit and e2e summary annotations: title, counts, report link, failures collapsed."""
import glob, os, subprocess, sys, tempfile
import xml.etree.ElementTree as ET


def agent(*args, check=True):
    result = subprocess.run(["buildkite-agent", *args], capture_output=True, text=True)
    if check and result.returncode != 0:
        sys.exit(f"buildkite-agent {args[0]} {args[1]} failed ({result.returncode}): {result.stderr.strip()}")
    return result


def step_outcome(key):
    result = agent("step", "get", "outcome", "--step", key, check=False)
    return result.stdout.strip() if result.returncode == 0 else "unknown"


def summarize(title, context, pattern, step_key, extra=""):
    with tempfile.TemporaryDirectory() as tmp:
        agent("artifact", "download", pattern, tmp, check=False)
        files = glob.glob(f"{tmp}/{pattern}")
        cases = [c for f in files for c in ET.parse(f).getroot().iter("testcase")]
    failed = [c for c in cases if c.find("failure") is not None or c.find("error") is not None]
    skipped = sum(c.find("skipped") is not None for c in cases)
    outcome = step_outcome(step_key)
    body = [f"### {title}", f"**{len(cases) - len(failed) - skipped}** passed · **{len(failed)}** failed · {skipped} skipped · {len(cases)} total · {len(files)} result file(s)", extra]
    if outcome != "passed":
        body.append(f":warning: The `{step_key}` step finished **{outcome}**; if fewer result files arrived than jobs ran, a job died before writing results and its tests are missing from these counts.")
    if failed:
        body += ["<details><summary>Failed tests</summary>\n", *[f"- `{c.get('name')}` in `{c.get('classname')}`" for c in failed], "</details>"]
    style = "success" if cases and not failed and outcome == "passed" else "error"
    agent("annotate", "\n\n".join(filter(None, body)), "--context", context, "--style", style)


job_artifact = agent("artifact", "search", "playwright-report/index.html", "--format", "%j %i", check=False).stdout.split()
link = "/".join(["https://buildkite.com/organizations", os.environ["BUILDKITE_ORGANIZATION_SLUG"], "pipelines",
                 os.environ["BUILDKITE_PIPELINE_SLUG"], "builds", os.environ["BUILDKITE_BUILD_NUMBER"],
                 "jobs", *job_artifact[:1], "artifacts", *job_artifact[1:2]])

summarize("Unit tests", "unit", "test-results/junit-unit.xml", "unit")
summarize("E2E tests", "e2e", "console/apps/console/e2e/results/junit-*.xml", "e2e",
          f":bar_chart: [HTML report]({link}) (traces and videos for failures)" if job_artifact else "No HTML report for this build.")
