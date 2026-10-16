#!/usr/bin/env python3
"""Unit and e2e summary annotations: title, counts, report link, failures collapsed."""
import glob, os, subprocess, tempfile
import xml.etree.ElementTree as ET


def agent(*args):
    return subprocess.run(["buildkite-agent", *args], capture_output=True, text=True).stdout


def summarize(title, context, pattern, extra=""):
    with tempfile.TemporaryDirectory() as tmp:
        agent("artifact", "download", pattern, tmp)
        cases = [c for f in glob.glob(f"{tmp}/{pattern}") for c in ET.parse(f).getroot().iter("testcase")]
    failed = [c for c in cases if c.find("failure") is not None or c.find("error") is not None]
    skipped = sum(c.find("skipped") is not None for c in cases)
    body = [f"### {title}", f"**{len(cases) - len(failed) - skipped}** passed · **{len(failed)}** failed · {skipped} skipped · {len(cases)} total", extra]
    if failed:
        body += ["<details><summary>Failed tests</summary>\n", *[f"- `{c.get('name')}` in `{c.get('classname')}`" for c in failed], "</details>"]
    style = "success" if cases and not failed else "error"
    agent("annotate", "\n\n".join(filter(None, body)), "--context", context, "--style", style)


job_artifact = agent("artifact", "search", "playwright-report/index.html", "--format", "%j %i").split()
link = "/".join(["https://buildkite.com/organizations", os.environ["BUILDKITE_ORGANIZATION_SLUG"], "pipelines",
                 os.environ["BUILDKITE_PIPELINE_SLUG"], "builds", os.environ["BUILDKITE_BUILD_NUMBER"],
                 "jobs", *job_artifact[:1], "artifacts", *job_artifact[1:2]])

summarize("Unit tests", "unit", "test-results/junit-unit.xml")
summarize("E2E tests", "e2e", "console/apps/console/e2e/results/junit-*.xml",
          f":bar_chart: [HTML report]({link}) (traces and videos for failures)" if job_artifact else "No HTML report for this build.")
