class Timesheet:
    @property
    def project_name(self):
        return "prop"

ts = Timesheet()
ts.project_name = "test"
print(ts.project_name)
