var Jobs = {
  backup: 'Appexchange_DF_Backup_Deploy',
  main_bvt: 'AppEX_DF_Main_BVT',
  main_ftests: 'AppEx_DF_Main_Build_Ftests2',
  perf: 'Appexchange_DF_Patch_Deploy',
  patch_bvt: 'AppEX_DF_Patch_BVT',
  patch_ftests: 'AppEx_DF_Patch_Build_Ftests',
  full: 'Appexchange_DF_Freeze_Deploy',
  freeze_bvt: 'AppEX_DF_Freeze_BVT',
  freeze_ftests: 'AppEx_DF_Freeze_Build_Ftests',
};

var react = 'build me';

function getJobs() {
  var b = '';
    for (build in Jobs) {
      b += build + ' | ';
    }
  return b;
}

module.exports = function (robot) {
  robot.hear(new RegExp('(shoot|kill)(.*) (robot|bot|droid|' + robot.name + ')', 'i'), function (msg) {
    return msg.send('oh no please don\'t kill me, im just the messenger');
  });

  robot.respond(/show( me)?( available)? builds/i, function (msg) {
    return msg.send(getJobs());
  });

  return robot.respond(/how is (\w*) build/i, function (msg) {
    var job = msg.match[1];
    var response;

    if (!Jobs[job]) {
      response = 'Can\'t understand you dude. '+ job + ' job build is not on my list \n' +
                 'This are the jobs i know: ' + getJobs();
      return msg.send(response);
    }

    return msg.http('http://jenkins.internal.salesforce.com/job/' + Jobs[job] + '/api/json').get()(function (err, res, body) {
      var data = JSON.parse(body)
      var url = data.url;
      var isrunning = data.inQueue;
      var lastCompletedBuild = data.lastCompletedBuild;
      var lastSuccessfulBuild = data.lastSuccessfulBuild;
      var lastGood = false;
      var result = 'unsuccessful';

      if (lastCompletedBuild.number === lastSuccessfulBuild.number) {
        lastGood = true;
      }

      if (lastGood) {
        result = 'successfull';
      }

      response = 'Last ' + job + ' build (' + lastCompletedBuild.number + ') was ' + result + '\n' +
                'Check it out for yourself if you don\'t believe me: ' + url;

      // Check if there is a build in progress right now.
      if (lastCompletedBuild.number < data.lastBuild.number) {
        response += '\nThere is actually a build going on right now:\n' +
                    'Number: ' + data.lastBuild.number + '\n' +
                    'URL: ' + data.lastBuild.url;
      }

      return msg.send(response);
    });
  });
};
