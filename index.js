const os = require("os"),
    fs = require("fs"),
    spawnSync = require("child_process").spawnSync

class Action {
    constructor() {
        this.projectFile = process.env.INPUT_PROJECT_FILE_PATH
        this.versionRegex = new RegExp(process.env.VERSION_REGEX, "m")
        this.tagFormat = process.env.TAG_FORMAT
    }

    _printErrorAndExit(msg) {
        console.log(`##[error]😭 ${msg}`)
        throw new Error(msg)
    }

    _executeCommand(cmd, options) {
        console.log(`executing: [${cmd}]`)

        const INPUT = cmd.split(" "), TOOL = INPUT[0], ARGS = INPUT.slice(1)
        return spawnSync(TOOL, ARGS, options)
    }

    _executeInProcess(cmd) {
        return this._executeCommand(cmd, { encoding: "utf-8", stdio: [process.stdin, process.stdout, process.stderr] })
    }

    _tagCommit(version) {
        const TAG = this.tagFormat.replace("*", version)

        console.log(`✨ creating new tag ${TAG}`)

        // TODO: Might have to check and see if tag already exists.
        const tagProc = this._executeInProcess(`git tag ${TAG}`)
        const tagExp = `fatal\: tag \'${TAG}\' already exists`;
        if (tagProc.stdout.match(tagExp) || tagProc.stdout.match(tagExp)) {
            process.stdout.write(`Tag \'${TAG}\' already exists.` + os.EOL)
        } else {
            this._executeInProcess(`git push origin ${TAG}`)
            process.stdout.write(`::set-output name=VERSION::${TAG}` + os.EOL)
        }
    }

    run() {
        if (!this.projectFile || !fs.existsSync(this.projectFile))
            this._printErrorAndExit("project file not found")

        console.log(`Project Filepath: ${this.projectFile}`)
        console.log(`Version Regex: ${this.versionRegex}`)

        const versionFileContent = fs.readFileSync(this.projectFile, { encoding: "utf-8" }),
            parsedVersion = this.versionRegex.exec(versionFileContent)

        if (!parsedVersion)
            this._printErrorAndExit("unable to extract version info!")

        this.version = parsedVersion[1]

        console.log(`Version: ${this.version}`)

        this._tagCommit(this.version)
    }
}

new Action().run()