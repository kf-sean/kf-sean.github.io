const API_HOST = "http://mqtt.kiaofarming.com";
const API_VER = "v1";

function set_switch(dev_id, port, sw, cb) {
  let req_data = {};
  req_data[`port${port}`] = sw;

  $.ajax({
    url: `${API_HOST}/${API_VER}/controller/switch/${dev_id}`,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    //headers: {Authorization: "Baerer {nTqOrlSptF156qc26duTSQhmuWFVA2RCeLCRRaenTb2}"},
    dataType: "json",
    data: req_data
  }).done(resp_data => {
    cb(resp_data);
  });
}

window.onload = () => {
  let QrkNV_id = "QrkNV";
  let QrkNV_switch_port1 = $(`input[type=radio][name="${QrkNV_id}_switch_port1"]`);
  let QrkNV_switch_port2 = $(`input[type=radio][name="${QrkNV_id}_switch_port2"]`);

  let dev_switch = $(`input[type=radio][name="dev_switch"]`);
  let input_dev_id = $("#dev_id");
  let input_port = $("#port");

  let input_resp_msg = $("#resp_msg");

  QrkNV_switch_port1.on("change", () => {
    set_switch(QrkNV_id, 1, QrkNV_switch_port1.val(), console.log);
  });

  QrkNV_switch_port2.on("change", () =>{
    set_switch(QrkNV_id, 2, QrkNV_switch_port2.val(), console.log);
  });

  function process_switch_response(resp) {
    dev_switch.removeAttr("disabled");
    if (resp.status === undefined) { // Invalid response
      return;
    }

    console.log(resp);
    switch (resp.status) {
      case 200:
        input_resp_msg.html("設定開關成功");
        break;
      
      case 408:
        input_resp_msg.html("裝置回應逾時");
        break;

      case 500:
        input_resp_msg.html("API伺服器內部發生錯誤");
        break;

      default:
    }
  }

  dev_switch.on("change", () => {
    if (input_dev_id.val() === "") {
      input_resp_msg.html("Device ID不得為空白");
      return;
    }

    dev_switch.attr("disabled", "disabled");
    input_resp_msg.html("等待API回應結果");
    set_switch(input_dev_id.val(), input_port.val(), dev_switch.val(), process_switch_response);
  });
};
