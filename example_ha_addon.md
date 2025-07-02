================================================
FILE: README.md
================================================
# Example Home Assistant add-on repository

This repository can be used as a "blueprint" for add-on development to help you get started.

Add-on documentation: <https://developers.home-assistant.io/docs/add-ons>

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fhome-assistant%2Faddons-example)

## Add-ons

This repository contains the following add-ons

### [Example add-on](./example)

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

_Example add-on to use as a blueprint for new add-ons._

<!--

Notes to developers after forking or using the github template feature:
- While developing comment out the 'image' key from 'example/config.yaml' to make the supervisor build the addon
  - Remember to put this back when pushing up your changes.
- When you merge to the 'main' branch of your repository a new build will be triggered.
  - Make sure you adjust the 'version' key in 'example/config.yaml' when you do that.
  - Make sure you update 'example/CHANGELOG.md' when you do that.
  - The first time this runs you might need to adjust the image configuration on github container registry to make it public
  - You may also need to adjust the github Actions configuration (Settings > Actions > General > Workflow > Read & Write)
- Adjust the 'image' key in 'example/config.yaml' so it points to your username instead of 'home-assistant'.
  - This is where the build images will be published to.
- Rename the example directory.
  - The 'slug' key in 'example/config.yaml' should match the directory name.
- Adjust all keys/url's that points to 'home-assistant' to now point to your user/fork.
- Share your repository on the forums https://community.home-assistant.io/c/projects/9
- Do awesome stuff!
 -->

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg



================================================
FILE: LICENSE
================================================
                                 Apache License
                           Version 2.0, January 2004
                        http://www.apache.org/licenses/

   TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION

   1. Definitions.

      "License" shall mean the terms and conditions for use, reproduction,
      and distribution as defined by Sections 1 through 9 of this document.

      "Licensor" shall mean the copyright owner or entity authorized by
      the copyright owner that is granting the License.

      "Legal Entity" shall mean the union of the acting entity and all
      other entities that control, are controlled by, or are under common
      control with that entity. For the purposes of this definition,
      "control" means (i) the power, direct or indirect, to cause the
      direction or management of such entity, whether by contract or
      otherwise, or (ii) ownership of fifty percent (50%) or more of the
      outstanding shares, or (iii) beneficial ownership of such entity.

      "You" (or "Your") shall mean an individual or Legal Entity
      exercising permissions granted by this License.

      "Source" form shall mean the preferred form for making modifications,
      including but not limited to software source code, documentation
      source, and configuration files.

      "Object" form shall mean any form resulting from mechanical
      transformation or translation of a Source form, including but
      not limited to compiled object code, generated documentation,
      and conversions to other media types.

      "Work" shall mean the work of authorship, whether in Source or
      Object form, made available under the License, as indicated by a
      copyright notice that is included in or attached to the work
      (an example is provided in the Appendix below).

      "Derivative Works" shall mean any work, whether in Source or Object
      form, that is based on (or derived from) the Work and for which the
      editorial revisions, annotations, elaborations, or other modifications
      represent, as a whole, an original work of authorship. For the purposes
      of this License, Derivative Works shall not include works that remain
      separable from, or merely link (or bind by name) to the interfaces of,
      the Work and Derivative Works thereof.

      "Contribution" shall mean any work of authorship, including
      the original version of the Work and any modifications or additions
      to that Work or Derivative Works thereof, that is intentionally
      submitted to Licensor for inclusion in the Work by the copyright owner
      or by an individual or Legal Entity authorized to submit on behalf of
      the copyright owner. For the purposes of this definition, "submitted"
      means any form of electronic, verbal, or written communication sent
      to the Licensor or its representatives, including but not limited to
      communication on electronic mailing lists, source code control systems,
      and issue tracking systems that are managed by, or on behalf of, the
      Licensor for the purpose of discussing and improving the Work, but
      excluding communication that is conspicuously marked or otherwise
      designated in writing by the copyright owner as "Not a Contribution."

      "Contributor" shall mean Licensor and any individual or Legal Entity
      on behalf of whom a Contribution has been received by Licensor and
      subsequently incorporated within the Work.

   2. Grant of Copyright License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      copyright license to reproduce, prepare Derivative Works of,
      publicly display, publicly perform, sublicense, and distribute the
      Work and such Derivative Works in Source or Object form.

   3. Grant of Patent License. Subject to the terms and conditions of
      this License, each Contributor hereby grants to You a perpetual,
      worldwide, non-exclusive, no-charge, royalty-free, irrevocable
      (except as stated in this section) patent license to make, have made,
      use, offer to sell, sell, import, and otherwise transfer the Work,
      where such license applies only to those patent claims licensable
      by such Contributor that are necessarily infringed by their
      Contribution(s) alone or by combination of their Contribution(s)
      with the Work to which such Contribution(s) was submitted. If You
      institute patent litigation against any entity (including a
      cross-claim or counterclaim in a lawsuit) alleging that the Work
      or a Contribution incorporated within the Work constitutes direct
      or contributory patent infringement, then any patent licenses
      granted to You under this License for that Work shall terminate
      as of the date such litigation is filed.

   4. Redistribution. You may reproduce and distribute copies of the
      Work or Derivative Works thereof in any medium, with or without
      modifications, and in Source or Object form, provided that You
      meet the following conditions:

      (a) You must give any other recipients of the Work or
          Derivative Works a copy of this License; and

      (b) You must cause any modified files to carry prominent notices
          stating that You changed the files; and

      (c) You must retain, in the Source form of any Derivative Works
          that You distribute, all copyright, patent, trademark, and
          attribution notices from the Source form of the Work,
          excluding those notices that do not pertain to any part of
          the Derivative Works; and

      (d) If the Work includes a "NOTICE" text file as part of its
          distribution, then any Derivative Works that You distribute must
          include a readable copy of the attribution notices contained
          within such NOTICE file, excluding those notices that do not
          pertain to any part of the Derivative Works, in at least one
          of the following places: within a NOTICE text file distributed
          as part of the Derivative Works; within the Source form or
          documentation, if provided along with the Derivative Works; or,
          within a display generated by the Derivative Works, if and
          wherever such third-party notices normally appear. The contents
          of the NOTICE file are for informational purposes only and
          do not modify the License. You may add Your own attribution
          notices within Derivative Works that You distribute, alongside
          or as an addendum to the NOTICE text from the Work, provided
          that such additional attribution notices cannot be construed
          as modifying the License.

      You may add Your own copyright statement to Your modifications and
      may provide additional or different license terms and conditions
      for use, reproduction, or distribution of Your modifications, or
      for any such Derivative Works as a whole, provided Your use,
      reproduction, and distribution of the Work otherwise complies with
      the conditions stated in this License.

   5. Submission of Contributions. Unless You explicitly state otherwise,
      any Contribution intentionally submitted for inclusion in the Work
      by You to the Licensor shall be under the terms and conditions of
      this License, without any additional terms or conditions.
      Notwithstanding the above, nothing herein shall supersede or modify
      the terms of any separate license agreement you may have executed
      with Licensor regarding such Contributions.

   6. Trademarks. This License does not grant permission to use the trade
      names, trademarks, service marks, or product names of the Licensor,
      except as required for reasonable and customary use in describing the
      origin of the Work and reproducing the content of the NOTICE file.

   7. Disclaimer of Warranty. Unless required by applicable law or
      agreed to in writing, Licensor provides the Work (and each
      Contributor provides its Contributions) on an "AS IS" BASIS,
      WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
      implied, including, without limitation, any warranties or conditions
      of TITLE, NON-INFRINGEMENT, MERCHANTABILITY, or FITNESS FOR A
      PARTICULAR PURPOSE. You are solely responsible for determining the
      appropriateness of using or redistributing the Work and assume any
      risks associated with Your exercise of permissions under this License.

   8. Limitation of Liability. In no event and under no legal theory,
      whether in tort (including negligence), contract, or otherwise,
      unless required by applicable law (such as deliberate and grossly
      negligent acts) or agreed to in writing, shall any Contributor be
      liable to You for damages, including any direct, indirect, special,
      incidental, or consequential damages of any character arising as a
      result of this License or out of the use or inability to use the
      Work (including but not limited to damages for loss of goodwill,
      work stoppage, computer failure or malfunction, or any and all
      other commercial damages or losses), even if such Contributor
      has been advised of the possibility of such damages.

   9. Accepting Warranty or Additional Liability. While redistributing
      the Work or Derivative Works thereof, You may choose to offer,
      and charge a fee for, acceptance of support, warranty, indemnity,
      or other liability obligations and/or rights consistent with this
      License. However, in accepting such obligations, You may act only
      on Your own behalf and on Your sole responsibility, not on behalf
      of any other Contributor, and only if You agree to indemnify,
      defend, and hold each Contributor harmless for any liability
      incurred by, or claims asserted against, such Contributor by reason
      of your accepting any such warranty or additional liability.

   END OF TERMS AND CONDITIONS

   APPENDIX: How to apply the Apache License to your work.

      To apply the Apache License to your work, attach the following
      boilerplate notice, with the fields enclosed by brackets "{}"
      replaced with your own identifying information. (Don't include
      the brackets!)  The text should be enclosed in the appropriate
      comment syntax for the file format. We also recommend that a
      file or class name and description of purpose be included on the
      same "printed page" as the copyright notice for easier
      identification within third-party archives.

   Copyright {yyyy} {name of copyright owner}

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.



================================================
FILE: repository.yaml
================================================
# https://developers.home-assistant.io/docs/add-ons/repository#repository-configuration
name: Example Home Assistant add-on repository
url: 'https://github.com/home-assistant/addons-example'
maintainer: Awesome Maintainer <awesome@example.com>


================================================
FILE: .devcontainer.json
================================================
{
  "name": "Example devcontainer for add-on repositories",
  "image": "ghcr.io/home-assistant/devcontainer:2-addons",
  "appPort": ["7123:8123", "7357:4357"],
  "postStartCommand": "bash devcontainer_bootstrap",
  "runArgs": ["-e", "GIT_EDITOR=code --wait", "--privileged"],
  "containerEnv": {
    "WORKSPACE_DIRECTORY": "${containerWorkspaceFolder}"
  },
  "customizations": {
    "vscode": {
      "extensions": ["timonwong.shellcheck", "esbenp.prettier-vscode"],
      "settings": {
        "terminal.integrated.profiles.linux": {
          "zsh": {
            "path": "/usr/bin/zsh"
          }
        },
        "terminal.integrated.defaultProfile.linux": "zsh",
        "editor.formatOnPaste": false,
        "editor.formatOnSave": true,
        "editor.formatOnType": true,
        "files.trimTrailingWhitespace": true
      }
    }
  },
  "mounts": [
    "type=volume,target=/var/lib/docker",
    "type=volume,target=/mnt/supervisor"
  ]
}



================================================
FILE: example/README.md
================================================
# Home Assistant Add-on: Example add-on

_Example add-on to use as a blueprint for new add-ons._

![Supports aarch64 Architecture][aarch64-shield]
![Supports amd64 Architecture][amd64-shield]
![Supports armhf Architecture][armhf-shield]
![Supports armv7 Architecture][armv7-shield]
![Supports i386 Architecture][i386-shield]

[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[armhf-shield]: https://img.shields.io/badge/armhf-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[i386-shield]: https://img.shields.io/badge/i386-yes-green.svg



================================================
FILE: example/apparmor.txt
================================================
#include <tunables/global>

profile example flags=(attach_disconnected,mediate_deleted) {
  #include <abstractions/base>

  # Capabilities
  file,
  signal (send) set=(kill,term,int,hup,cont),

  # S6-Overlay
  /init ix,
  /bin/** ix,
  /usr/bin/** ix,
  /run/{s6,s6-rc*,service}/** ix,
  /package/** ix,
  /command/** ix,
  /etc/services.d/** rwix,
  /etc/cont-init.d/** rwix,
  /etc/cont-finish.d/** rwix,
  /run/{,**} rwk,
  /dev/tty rw,

  # Bashio
  /usr/lib/bashio/** ix,
  /tmp/** rwk,

  # Access to options.json and other files within your addon
  /data/** rw,

  # Start new profile for service
  /usr/bin/my_program cx -> my_program,

  profile my_program flags=(attach_disconnected,mediate_deleted) {
    #include <abstractions/base>

    # Receive signals from S6-Overlay
    signal (receive) peer=*_example,

    # Access to options.json and other files within your addon
    /data/** rw,

    # Access to mapped volumes specified in config.json
    /share/** rw,

    # Access required for service functionality
    # Note: List was built by doing the following:
    # 1. Add what is obviously needed based on what is in the script
    # 2. Add `complain` as a flag to this profile temporarily and run the addon
    # 3. Review the audit log with `journalctl _TRANSPORT="audit" -g 'apparmor="ALLOWED"'` and add other access as needed
    # Remember to remove the `complain` flag when you are done
    /usr/bin/my_program r,
    /bin/bash rix,
    /bin/echo ix,
    /etc/passwd r,
    /dev/tty rw,
  }
}


================================================
FILE: example/build.yaml
================================================
# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
build_from:
  aarch64: "ghcr.io/home-assistant/aarch64-base:3.15"
  amd64: "ghcr.io/home-assistant/amd64-base:3.15"
  armhf: "ghcr.io/home-assistant/armhf-base:3.15"
  armv7: "ghcr.io/home-assistant/armv7-base:3.15"
  i386: "ghcr.io/home-assistant/i386-base:3.15"
labels:
  org.opencontainers.image.title: "Home Assistant Add-on: Example add-on"
  org.opencontainers.image.description: "Example add-on to use as a blueprint for new add-ons."
  org.opencontainers.image.source: "https://github.com/home-assistant/addons-example"
  org.opencontainers.image.licenses: "Apache License 2.0"
args:
  TEMPIO_VERSION: "2021.09.0"



================================================
FILE: example/CHANGELOG.md
================================================
<!-- https://developers.home-assistant.io/docs/add-ons/presentation#keeping-a-changelog -->

## 1.2.0

- Add an apparmor profile
- Update to 3.15 base image with s6 v3
- Add a sample script to run as service and constrain in aa profile

## 1.1.0

- Updates

## 1.0.0

- Initial release



================================================
FILE: example/config.yaml
================================================
# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-config
name: Example add-on
version: "1.2.0"
slug: example
description: Example add-on
url: "https://github.com/home-assistant/addons-example/tree/main/example"
arch:
  - armhf
  - armv7
  - aarch64
  - amd64
  - i386
init: false
map:
  - share:rw
options:
  message: "Hello world..."
schema:
  message: "str?"
image: "ghcr.io/home-assistant/{arch}-addon-example"



================================================
FILE: example/Dockerfile
================================================
# https://developers.home-assistant.io/docs/add-ons/configuration#add-on-dockerfile
ARG BUILD_FROM
FROM $BUILD_FROM

# Execute during the build of the image
ARG TEMPIO_VERSION BUILD_ARCH
RUN \
    curl -sSLf -o /usr/bin/tempio \
    "https://github.com/home-assistant/tempio/releases/download/${TEMPIO_VERSION}/tempio_${BUILD_ARCH}"

# Copy root filesystem
COPY rootfs /



================================================
FILE: example/DOCS.md
================================================
# Home Assistant Add-on: Example add-on

## How to use

This add-on really does nothing. It is just an example.

When started it will print the configured message or "Hello world" in the log.

It will also print "All done!" in `/share/example_addon_output.txt` to show
simple example of the usage of `map` in addon config.



================================================
FILE: example/rootfs/etc/services.d/example/finish
================================================
#!/usr/bin/env bashio
# ==============================================================================
# Take down the S6 supervision tree when example fails
# s6-overlay docs: https://github.com/just-containers/s6-overlay
# ==============================================================================

declare APP_EXIT_CODE=${1}

if [[ "${APP_EXIT_CODE}" -ne 0 ]] && [[ "${APP_EXIT_CODE}" -ne 256 ]]; then
  bashio::log.warning "Halt add-on with exit code ${APP_EXIT_CODE}"
  echo "${APP_EXIT_CODE}" > /run/s6-linux-init-container-results/exitcode
  exec /run/s6/basedir/bin/halt
fi

bashio::log.info "Service restart after closing"



================================================
FILE: example/rootfs/etc/services.d/example/run
================================================
#!/usr/bin/with-contenv bashio
# ==============================================================================
# Start the example service
# s6-overlay docs: https://github.com/just-containers/s6-overlay
# ==============================================================================

# Add your code here

# Declare variables
declare message

## Get the 'message' key from the user config options.
message=$(bashio::config 'message')

## Print the message the user supplied, defaults to "Hello World..."
bashio::log.info "${message:="Hello World..."}"

## Run your program
exec /usr/bin/my_program



================================================
FILE: example/translations/en.yaml
================================================
configuration:
  message:
    name: Message
    description: The message that will be printed to the log when starting this example add-on.



================================================
FILE: .github/dependabot.yaml
================================================
version: 2
updates:
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: weekly
      time: "06:00"



================================================
FILE: .github/workflows/builder.yaml
================================================
name: Builder

env:
  BUILD_ARGS: "--test"
  MONITORED_FILES: "build.yaml config.yaml Dockerfile rootfs"

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main

jobs:
  init:
    runs-on: ubuntu-latest
    name: Initialize builds
    outputs:
      changed_addons: ${{ steps.changed_addons.outputs.addons }}
      changed: ${{ steps.changed_addons.outputs.changed }}
    steps:
      - name: Check out the repository
        uses: actions/checkout@v4.2.2

      - name: Get changed files
        id: changed_files
        uses: jitterbit/get-changed-files@v1

      - name: Find add-on directories
        id: addons
        uses: home-assistant/actions/helpers/find-addons@master

      - name: Get changed add-ons
        id: changed_addons
        run: |
          declare -a changed_addons
          for addon in ${{ steps.addons.outputs.addons }}; do
            if [[ "${{ steps.changed_files.outputs.all }}" =~ $addon ]]; then
              for file in ${{ env.MONITORED_FILES }}; do
                  if [[ "${{ steps.changed_files.outputs.all }}" =~ $addon/$file ]]; then
                    if [[ ! "${changed_addons[@]}" =~ $addon ]]; then
                      changed_addons+=("\"${addon}\",");
                    fi
                  fi
              done
            fi
          done

          changed=$(echo ${changed_addons[@]} | rev | cut -c 2- | rev)

          if [[ -n ${changed} ]]; then
            echo "Changed add-ons: $changed";
            echo "changed=true" >> $GITHUB_OUTPUT;
            echo "addons=[$changed]" >> $GITHUB_OUTPUT;
          else
            echo "No add-on had any monitored files changed (${{ env.MONITORED_FILES }})";
          fi
  build:
    needs: init
    runs-on: ubuntu-latest
    if: needs.init.outputs.changed == 'true'
    name: Build ${{ matrix.arch }} ${{ matrix.addon }} add-on
    strategy:
      matrix:
        addon: ${{ fromJson(needs.init.outputs.changed_addons) }}
        arch: ["aarch64", "amd64", "armhf", "armv7", "i386"]
    permissions:
      contents: read
      packages: write

    steps:
      - name: Check out repository
        uses: actions/checkout@v4.2.2

      - name: Get information
        id: info
        uses: home-assistant/actions/helpers/info@master
        with:
          path: "./${{ matrix.addon }}"

      - name: Check if add-on should be built
        id: check
        run: |
          if [[ "${{ steps.info.outputs.image }}" == "null" ]]; then
            echo "Image property is not defined, skipping build"
            echo "build_arch=false" >> $GITHUB_OUTPUT;
          elif [[ "${{ steps.info.outputs.architectures }}" =~ ${{ matrix.arch }} ]]; then
            echo "build_arch=true" >> $GITHUB_OUTPUT;
            echo "image=$(echo ${{ steps.info.outputs.image }} | cut -d'/' -f3)" >> $GITHUB_OUTPUT;
            if [[ -z "${{ github.head_ref }}" ]] && [[ "${{ github.event_name }}" == "push" ]]; then
                echo "BUILD_ARGS=" >> $GITHUB_ENV;
            fi
          else
            echo "${{ matrix.arch }} is not a valid arch for ${{ matrix.addon }}, skipping build";
            echo "build_arch=false" >> $GITHUB_OUTPUT;
          fi

      - name: Login to GitHub Container Registry
        if: env.BUILD_ARGS != '--test'
        uses: docker/login-action@v3.4.0
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build ${{ matrix.addon }} add-on
        if: steps.check.outputs.build_arch == 'true'
        uses: home-assistant/builder@2025.03.0
        with:
          args: |
            ${{ env.BUILD_ARGS }} \
            --${{ matrix.arch }} \
            --target /data/${{ matrix.addon }} \
            --image "${{ steps.check.outputs.image }}" \
            --docker-hub "ghcr.io/${{ github.repository_owner }}" \
            --addon



================================================
FILE: .github/workflows/lint.yaml
================================================
name: Lint

on:
  push:
    branches:
      - main
  pull_request:
    branches:
      - main
  schedule:
    - cron: "0 0 * * *"

jobs:
  find:
    name: Find add-ons
    runs-on: ubuntu-latest
    outputs:
      addons: ${{ steps.addons.outputs.addons_list }}
    steps:
      - name: ⤵️ Check out code from GitHub
        uses: actions/checkout@v4.2.2

      - name: 🔍 Find add-on directories
        id: addons
        uses: home-assistant/actions/helpers/find-addons@master

  lint:
    name: Lint add-on ${{ matrix.path }}
    runs-on: ubuntu-latest
    needs: find
    strategy:
      matrix:
        path: ${{ fromJson(needs.find.outputs.addons) }}
    steps:
      - name: ⤵️ Check out code from GitHub
        uses: actions/checkout@v4.2.2

      - name: 🚀 Run Home Assistant Add-on Lint
        uses: frenck/action-addon-linter@v2.18
        with:
          path: "./${{ matrix.path }}"


