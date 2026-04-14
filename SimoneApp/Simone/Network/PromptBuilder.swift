import Foundation

struct WeightedPrompt: Codable {
    let text: String
    let weight: Float
}

enum PromptBuilder {
    static func build(scene: Scene?, style: MusicStyle?) -> [WeightedPrompt] {
        var prompts: [WeightedPrompt] = []
        if let style {
            prompts.append(WeightedPrompt(text: style.prompt, weight: style.promptWeight))
        }
        if let scene {
            prompts.append(WeightedPrompt(text: scene.prompt, weight: scene.promptWeight))
        }
        return prompts
    }

    static func toJSON(prompts: [WeightedPrompt]) -> Data {
        let payload: [String: Any] = [
            "command": "set_prompts",
            "prompts": prompts.map { ["text": $0.text, "weight": $0.weight] }
        ]
        return try! JSONSerialization.data(withJSONObject: payload)
    }

    static func commandJSON(_ command: String) -> Data {
        try! JSONSerialization.data(withJSONObject: ["command": command])
    }

    static func configJSON(_ config: [String: Any]) -> Data {
        let payload: [String: Any] = ["command": "set_config", "config": config]
        return try! JSONSerialization.data(withJSONObject: payload)
    }
}
