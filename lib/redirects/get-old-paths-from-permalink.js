import { latest, deprecated, lastReleaseWithLegacyFormat, firstRestoredAdminGuides } from '../enterprise-server-releases.js'
import { getPathWithoutLanguage, getPathWithLanguage, getVersionStringFromPath } from '../path-utils.js'
import patterns from '../patterns.js'
import versionSatisfiesRange from '../version-satisfies-range.js'
import xAllVersions from '../all-versions.js'
import nonEnterpriseDefaultVersion from '../non-enterprise-default-version.js'
const currentlySupportedVersions = Object.keys(xAllVersions)

// This function takes a current path, applies what we know about historically
// supported paths, and returns an array of ALL possible associated old
// paths that users might try to hit.
export default function getOldPathsFromPath (currentPath, languageCode, currentVersion) {
  const oldPaths = new Set()

  const versionFromPath = getVersionStringFromPath(currentPath)

  // This only applies to Dotcom paths, so no need to determine whether the version is deprecated
  // create old path /free-pro-team@latest/github from new path /github (or from a frontmatter `redirect_from` path like /articles)
  if (versionFromPath === 'homepage' || !(currentlySupportedVersions.includes(versionFromPath) || deprecated.includes(versionFromPath)) || (versionFromPath === nonEnterpriseDefaultVersion && !currentPath.includes(nonEnterpriseDefaultVersion))) {
    oldPaths.add(currentPath
      .replace(`/${languageCode}`, `/${languageCode}/${nonEnterpriseDefaultVersion}`))
  }

  // ------ BEGIN LEGACY VERSION FORMAT REPLACEMENTS ------//
  // These remain relevant to handle legacy-formatted frontmatter redirects
  // and archived versions paths.

  // create old path /insights from current path /enterprise/version/insights
  oldPaths.add(currentPath
    .replace(`/${languageCode}/enterprise/${latest}/user/insights`, '/insights'))

  // create old path /desktop/guides from current path /desktop
  if (currentPath.includes('/desktop') && !currentPath.includes('/guides')) {
    oldPaths.add(currentPath
      .replace('/desktop', '/desktop/guides'))
  }

  // create old path /admin/guides from current path /admin
  if (currentPath.includes('admin') && !currentPath.includes('/guides')) {
    // ... but ONLY on versions <2.21 and in deep links on all versions
    if (versionSatisfiesRange(currentVersion, `<${firstRestoredAdminGuides}`) || !currentPath.endsWith('/admin')) {
      oldPaths.add(currentPath
        .replace('/admin', '/admin/guides'))
    }
  }

  // create old path /user from current path /user/github on 2.16+ only
  if (currentlySupportedVersions.includes(currentVersion) || versionSatisfiesRange(currentVersion, '>2.15')) {
    oldPaths.add(currentPath
      .replace('/user/github', '/user'))
  }

  // create old path /enterprise from current path /enterprise/latest
  oldPaths.add(currentPath
    .replace(`/enterprise/${latest}`, '/enterprise'))

  // create old path /enterprise/foo from current path /enterprise/user/foo
  // this supports old developer paths like /enterprise/webhooks with no /user in them
  if (currentPath.includes('/enterprise/')) {
    oldPaths.add(currentPath
      .replace('/user/', '/'))
  }

  // ------ END LEGACY VERSION FORMAT REPLACEMENTS ------//

  // ------ BEGIN MODERN VERSION FORMAT REPLACEMENTS ------//
  if (currentlySupportedVersions.includes(currentVersion) || versionSatisfiesRange(currentVersion, `>${lastReleaseWithLegacyFormat}`)) {
    (new Set(oldPaths)).forEach(oldPath => {
      // create old path /enterprise/<version> from new path /enterprise-server@<version>
      oldPaths.add(oldPath
        .replace(/\/enterprise-server@(\d)/, '/enterprise/$1'))

      // create old path /enterprise/<version>/user from new path /enterprise-server@<version>/github
      oldPaths.add(oldPath
        .replace(/\/enterprise-server@(\d.+?)\/github/, '/enterprise/$1/user'))

      // create old path /insights from new path /enterprise-server@<latest>/insights
      oldPaths.add(oldPath
        .replace(`/enterprise-server@${latest}/insights`, '/insights'))

      // create old path /admin from new path /enterprise-server@<latest>/admin
      oldPaths.add(oldPath
        .replace(`/enterprise-server@${latest}/admin`, '/admin'))

      // create old path /enterprise from new path /enterprise-server@<latest>
      oldPaths.add(oldPath
        .replace(`/enterprise-server@${latest}`, '/enterprise'))

      // create old path /enterprise-server from new path /enterprise-server@<latest>
      oldPaths.add(oldPath
        .replace(`/enterprise-server@${latest}`, '/enterprise-server'))

      // create old path /enterprise-server@latest from new path /enterprise-server@<latest>
      oldPaths.add(oldPath
        .replace(`/enterprise-server@${latest}`, '/enterprise-server@latest'))

      if (!patterns.adminProduct.test(oldPath)) {
        // create old path /enterprise/<version>/user/foo from new path /enterprise-server@<version>/foo
        oldPaths.add(currentPath
          .replace(/\/enterprise-server@(\d.+?)\//, '/enterprise/$1/user/'))

        // create old path /enterprise/user/foo from new path /enterprise-server@<latest>/foo
        oldPaths.add(currentPath
          .replace(`/enterprise-server@${latest}/`, '/enterprise/user/'))
      }
    })
  }
  // ------ END MODERN VERSION FORMAT REPLACEMENTS ------//

  // ------ BEGIN ONEOFF REPLACEMENTS ------//

  // create special old path /enterprise-server-releases from current path /enterprise-server@<release>/admin/all-releases
  if (versionSatisfiesRange(currentVersion, `=${latest}`) && currentPath.endsWith('/admin/all-releases')) {
    oldPaths.add('/enterprise-server-releases')
  }

  // ------ END ONEOFF REPLACEMENTS ------//

  // For each old path added to the set above, do the following...
  (new Set(oldPaths)).forEach(oldPath => {
    // for English only, remove language code
    if (languageCode === 'en') {
      oldPaths.add(getPathWithoutLanguage(oldPath))
    }

    // add language code
    oldPaths.add(getPathWithLanguage(oldPath, languageCode))
  })

  // exclude any empty old paths that may have been derived
  oldPaths.delete('')
  oldPaths.delete('/')

  return oldPaths
}
